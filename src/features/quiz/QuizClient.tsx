'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCorridorQuestions, runCorridorsEngine, type CorridorsOptionKey } from '@/core';
import {
  buildCorridorAnswerSequence,
  buildQuizCountdownState,
  calculateQuizProgress,
  calculateQuizSecondsRemaining,
  createQuizQuestionDeadline,
  getLastAnsweredQuestionIndex,
  getNextUnansweredQuestionIndex,
  getPreviousQuestionIndex,
  parseKeyboardOptionKey,
  QUIZ_SECONDS_PER_QUESTION,
  removeAnswerForQuestion,
  saveCorridorsResultToSessionStorage,
  type DraftCorridorsAnswers
} from './quizFlow';
import {
  buildCompletionPanel,
  buildOptionButtonClassName,
  buildQuizStatusSummary,
  buildReviewDots
} from './quizPresentation';
import { buildQuizOptionIdentity, buildQuizVisualFrame } from './quizVisualIdentity';

interface LastAnswerActivation {
  readonly questionId: number;
  readonly option: CorridorsOptionKey;
  readonly activatedAt: number;
}

export function QuizClient() {
  const router = useRouter();
  const questions = useMemo(() => getCorridorQuestions(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<DraftCorridorsAnswers>({});
  const [deadlineMs, setDeadlineMs] = useState(() => createQuizQuestionDeadline(Date.now()));
  const [secondsRemaining, setSecondsRemaining] = useState(QUIZ_SECONDS_PER_QUESTION);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'Pick one answer. No result hints appear until all questions are complete.'
  );

  const answersRef = useRef<DraftCorridorsAnswers>(answers);
  const currentIndexRef = useRef(currentIndex);
  const isTimedOutRef = useRef(isTimedOut);
  const suppressNextClickRef = useRef(false);
  const lastAnswerActivationRef = useRef<LastAnswerActivation | null>(null);

  const maybeCurrentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(answers).length;
  const progress = calculateQuizProgress(currentIndex, questions.length, answeredCount);
  const statusSummary = buildQuizStatusSummary(progress);
  const completionPanel = buildCompletionPanel(progress);
  const reviewDots = buildReviewDots(questions, answers, currentIndex, progress.isComplete);
  const countdownState = buildQuizCountdownState(progress.isComplete ? 0 : secondsRemaining);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isTimedOutRef.current = isTimedOut;
  }, [isTimedOut]);

  const resetQuestionTimer = useCallback(() => {
    setDeadlineMs(createQuizQuestionDeadline(Date.now()));
    setSecondsRemaining(QUIZ_SECONDS_PER_QUESTION);
    setIsTimedOut(false);
    isTimedOutRef.current = false;
  }, []);

  const restartQuiz = useCallback(() => {
    const emptyAnswers: DraftCorridorsAnswers = {};
    answersRef.current = emptyAnswers;
    currentIndexRef.current = 0;
    lastAnswerActivationRef.current = null;
    suppressNextClickRef.current = false;
    setAnswers(emptyAnswers);
    setCurrentIndex(0);
    resetQuestionTimer();
    setStatusMessage('Quiz restarted. Pick one answer before the 10-second timer expires.');
  }, [resetQuestionTimer]);

  const generateResult = useCallback(() => {
    if (isTimedOutRef.current) {
      setStatusMessage('Time expired. Restart the quiz before generating a report.');
      return;
    }

    try {
      const answerSequence = buildCorridorAnswerSequence(questions, answersRef.current);
      const result = runCorridorsEngine(answerSequence);
      saveCorridorsResultToSessionStorage(window.sessionStorage, result);
      setStatusMessage('Result generated. Opening the report.');
      router.push('/results');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not complete the corridor map.');
    }
  }, [questions, router]);

  const selectAnswer = useCallback(
    (option: CorridorsOptionKey, source: 'keyboard' | 'pointer' | 'click' | 'button-key' = 'click') => {
      if (isTimedOutRef.current) {
        setStatusMessage('Time expired. Restart the quiz to continue.');
        return;
      }

      const sourceIndex = currentIndexRef.current;
      const currentQuestion = questions[sourceIndex];

      if (!currentQuestion) {
        return;
      }

      const activatedAt = Date.now();
      const lastActivation = lastAnswerActivationRef.current;

      if (
        lastActivation !== null &&
        lastActivation.questionId === currentQuestion.id &&
        lastActivation.option === option &&
        activatedAt - lastActivation.activatedAt < 240
      ) {
        return;
      }

      lastAnswerActivationRef.current = {
        questionId: currentQuestion.id,
        option,
        activatedAt
      };

      const nextAnswers: DraftCorridorsAnswers = {
        ...answersRef.current,
        [currentQuestion.id]: option
      };

      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);

      const nextUnansweredIndex = getNextUnansweredQuestionIndex(questions, nextAnswers, sourceIndex);

      if (nextUnansweredIndex !== null) {
        currentIndexRef.current = nextUnansweredIndex;
        setCurrentIndex(nextUnansweredIndex);
        resetQuestionTimer();
        setStatusMessage(`Answer ${option} submitted by ${source}. Next timed question.`);
        return;
      }

      setSecondsRemaining(0);
      setStatusMessage('All questions complete. Generate your report when ready.');
    },
    [questions, resetQuestionTimer]
  );

  const goBack = useCallback(() => {
    if (isTimedOutRef.current) {
      setStatusMessage('Time expired. Restart the quiz to continue.');
      return;
    }

    const nextIndex = getPreviousQuestionIndex(currentIndexRef.current);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    resetQuestionTimer();
    setStatusMessage('Question reopened. Timer restarted.');
  }, [resetQuestionTimer]);

  const reviewFromStart = useCallback(() => {
    if (isTimedOutRef.current) {
      setStatusMessage('Time expired. Restart the quiz to continue.');
      return;
    }

    currentIndexRef.current = 0;
    setCurrentIndex(0);
    resetQuestionTimer();
    setStatusMessage('Review from question 1. Timer restarted.');
  }, [resetQuestionTimer]);

  const openReviewQuestion = useCallback(
    (index: number) => {
      if (isTimedOutRef.current) {
        setStatusMessage('Time expired. Restart the quiz to continue.');
        return;
      }

      currentIndexRef.current = index;
      setCurrentIndex(index);
      resetQuestionTimer();
      setStatusMessage('Question opened. Timer restarted.');
    },
    [resetQuestionTimer]
  );

  const undoLastAnswer = useCallback(() => {
    if (isTimedOutRef.current) {
      setStatusMessage('Time expired. Restart the quiz to continue.');
      return;
    }

    const lastAnsweredIndex = getLastAnsweredQuestionIndex(questions, answersRef.current);

    if (lastAnsweredIndex === null) {
      setStatusMessage('No answer to undo yet.');
      return;
    }

    const question = questions[lastAnsweredIndex];

    if (!question) {
      return;
    }

    const nextAnswers = removeAnswerForQuestion(answersRef.current, question.id);
    answersRef.current = nextAnswers;
    currentIndexRef.current = lastAnsweredIndex;
    setAnswers(nextAnswers);
    setCurrentIndex(lastAnsweredIndex);
    resetQuestionTimer();
    setStatusMessage('Last answer cleared. Timer restarted.');
  }, [questions, resetQuestionTimer]);

  useEffect(() => {
    if (progress.isComplete || isTimedOut) {
      return;
    }

    function updateCountdown() {
      const nextSecondsRemaining = calculateQuizSecondsRemaining(deadlineMs, Date.now());
      setSecondsRemaining(nextSecondsRemaining);

      if (nextSecondsRemaining === 0) {
        setIsTimedOut(true);
        isTimedOutRef.current = true;
        setStatusMessage('Time expired. Restart the quiz to continue.');
      }
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(intervalId);
  }, [deadlineMs, isTimedOut, progress.isComplete]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || isEditableKeyboardTarget(event.target)) {
        return;
      }

      const option = parseKeyboardOptionKey(event.key, event.code);

      if (option !== null) {
        event.preventDefault();
        selectAnswer(option, 'keyboard');
        return;
      }

      if (event.key === 'Enter' && progress.isComplete) {
        event.preventDefault();
        generateResult();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        undoLastAnswer();
      }
    }

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [generateResult, goBack, progress.isComplete, selectAnswer, undoLastAnswer]);

  if (!maybeCurrentQuestion) {
    return (
      <main className="page-shell quiz-shell">
        <section className="panel quiz-card polished-state-card">
          <p className="kicker">Quiz unavailable</p>
          <h2>No corridor questions were loaded.</h2>
        </section>
      </main>
    );
  }

  const currentQuestion = maybeCurrentQuestion;
  const selectedOption = answers[currentQuestion.id];
  const visualFrame = buildQuizVisualFrame(progress, currentQuestion.id);
  const isInteractionBlocked = isTimedOut;

  return (
    <main className="page-shell quiz-shell quiz-shell-identity" data-quiz-workflow="timed-interactive">
      <section className="panel quiz-card quiz-card-polished quiz-card-identity" aria-labelledby="quiz-title">
        <div className={visualFrame.frameClassName} aria-label="Quiz visual identity status">
          <span className="quiz-corridor-mark">{visualFrame.corridorMark}</span>
          <span>{visualFrame.phaseLabel}</span>
          <span>{visualFrame.paceLabel}</span>
          <span>{visualFrame.atmosphereLabel}</span>
        </div>
        <div className="quiz-topbar">
          <div>
            <span className="kicker">Corridor {progress.currentCorridor} / {progress.totalCorridors}</span>
            <p>{progress.progressPercent}% answered · {progress.answeredCount} submitted</p>
          </div>
          <div className="quiz-mode-pill" aria-label="Current quiz mode">{statusSummary.modeLabel}</div>
        </div>

        <div className="progress-track quiz-progress-track" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress.progressPercent}%` }} />
        </div>

        <div className="quiz-mobile-summary" aria-label="Quiz progress summary">
          <span>{statusSummary.answeredLabel}</span>
          <span>{statusSummary.remainingLabel}</span>
          <span>{statusSummary.keyboardHint}</span>
        </div>

        <div
          className="quiz-countdown-panel"
          data-quiz-countdown="visible"
          data-urgency={countdownState.urgency}
          role="timer"
          aria-live="polite"
        >
          <span className="quiz-countdown-value">{progress.isComplete ? 'Complete' : countdownState.label}</span>
          <span className="quiz-countdown-label">10 seconds per question. No result hints during the quiz.</span>
        </div>

        <div className="instruction-strip quiz-instruction-strip" aria-label="Quiz rules">
          <span>Choose one answer.</span>
          <span>Timer resets after each submitted answer.</span>
          <span>No result hints before completion.</span>
        </div>

        {isTimedOut ? (
          <aside className="quiz-timeout-panel" role="alert" aria-label="Quiz timer expired">
            <div>
              <p className="kicker">Timer expired</p>
              <h3>Restart required.</h3>
              <p>The 10-second question timer reached zero. Restart the quiz to continue.</p>
            </div>
            <button className="button" onClick={restartQuiz} type="button">
              Restart quiz
            </button>
          </aside>
        ) : null}

        <div className="quiz-question-block quiz-question-identity-block">
          <p className="kicker">Question {currentQuestion.id}</p>
          <h2 id="quiz-title">{currentQuestion.text}</h2>
          <p className="lede">Answer quickly. The report stays hidden until every question is complete.</p>
        </div>

        <div className="option-grid quiz-option-grid" aria-label="Answer options">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option.key;
            const optionIdentity = buildQuizOptionIdentity(option.key, isSelected);

            return (
              <button
                aria-keyshortcuts={option.key}
                aria-pressed={isSelected}
                className={`${buildOptionButtonClassName(isSelected)} ${optionIdentity.className}`}
                data-interaction-target="quiz-answer-option"
                data-option-key={option.key}
                disabled={isInteractionBlocked}
                key={option.key}
                onClick={(event) => {
                  event.preventDefault();

                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }

                  selectAnswer(option.key, 'click');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    suppressNextClickRef.current = true;
                    selectAnswer(option.key, 'button-key');
                  }
                }}
                onPointerUp={(event) => {
                  if (event.button !== 0 && event.pointerType === 'mouse') {
                    return;
                  }

                  event.preventDefault();
                  event.currentTarget.focus();
                  suppressNextClickRef.current = true;
                  selectAnswer(option.key, 'pointer');
                }}
                type="button"
              >
                <span className="option-key">{option.key}</span>
                <span className="option-text">{option.text}</span>
                <span className="option-signal">{optionIdentity.signalLabel}</span>
                <span className="option-hint">Click, tap, or press {option.key}</span>
              </button>
            );
          })}
        </div>

        {completionPanel.isVisible && !isTimedOut ? (
          <aside className="quiz-completion-panel" aria-label="Completion review">
            <div>
              <p className="kicker">Completion review</p>
              <h3>{completionPanel.headline}</h3>
              <p>{completionPanel.body}</p>
              <span>{completionPanel.keyboardHint}</span>
            </div>
            <div className="quiz-completion-actions">
              <button className="button" onClick={generateResult} type="button">
                {completionPanel.primaryActionLabel}
              </button>
              <button className="button secondary" onClick={reviewFromStart} type="button">
                {completionPanel.secondaryActionLabel}
              </button>
            </div>
          </aside>
        ) : null}

        <div className="quiz-review-zone">
          <div className="quiz-review-heading">
            <span>Question map</span>
            <span>{statusSummary.answeredLabel}</span>
          </div>
          <div className="review-strip quiz-review-strip" aria-label="Question review">
          {reviewDots.map((dot, index) => (
            <button
              aria-current={dot.isCurrent ? 'step' : undefined}
              aria-label={dot.ariaLabel}
              className={dot.className}
              disabled={isInteractionBlocked}
              key={dot.questionId}
              onClick={() => openReviewQuestion(index)}
              title={dot.title}
              type="button"
            >
              {dot.label}
            </button>
          ))}
          </div>
        </div>

        <div className="actions quiz-actions">
          <button className="button secondary" disabled={progress.isFirst || isInteractionBlocked} onClick={goBack} type="button">
            Previous
          </button>
          <button className="button secondary" disabled={answeredCount === 0 || isInteractionBlocked} onClick={undoLastAnswer} type="button">
            Undo last answer
          </button>
          {isTimedOut ? (
            <button className="button" onClick={restartQuiz} type="button">
              Restart quiz
            </button>
          ) : (
            <button className="button" disabled={!progress.isComplete} onClick={generateResult} type="button">
              Generate report
            </button>
          )}
        </div>
        <p className="small live-status" aria-live="polite">{statusMessage}</p>
      </section>
    </main>
  );
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}
