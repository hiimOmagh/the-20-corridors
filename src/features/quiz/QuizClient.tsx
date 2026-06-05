'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCorridorQuestions, runCorridorsEngine, type CorridorsOptionKey } from '@/core';
import {
  buildCorridorAnswerSequence,
  calculateQuizProgress,
  getLastAnsweredQuestionIndex,
  getNextUnansweredQuestionIndex,
  getPreviousQuestionIndex,
  parseKeyboardOptionKey,
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

export function QuizClient() {
  const router = useRouter();
  const questions = useMemo(() => getCorridorQuestions(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<DraftCorridorsAnswers>({});
  const [statusMessage, setStatusMessage] = useState('Choose quickly. One answer only. Keyboard: A/B/C/D.');
  const maybeCurrentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(answers).length;
  const progress = calculateQuizProgress(currentIndex, questions.length, answeredCount);
  const statusSummary = buildQuizStatusSummary(progress);
  const completionPanel = buildCompletionPanel(progress);
  const reviewDots = buildReviewDots(questions, answers, currentIndex);

  const generateResult = useCallback(() => {
    try {
      const answerSequence = buildCorridorAnswerSequence(questions, answers);
      const result = runCorridorsEngine(answerSequence);
      saveCorridorsResultToSessionStorage(window.sessionStorage, result);
      setStatusMessage('Result generated. Opening the report.');
      router.push('/results');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not complete the corridor map.');
    }
  }, [answers, questions, router]);

  const selectAnswer = useCallback(
    (option: CorridorsOptionKey) => {
      const currentQuestion = questions[currentIndex];

      if (!currentQuestion) {
        return;
      }

      const nextAnswers: DraftCorridorsAnswers = {
        ...answers,
        [currentQuestion.id]: option
      };

      setAnswers(nextAnswers);

      const nextUnansweredIndex = getNextUnansweredQuestionIndex(questions, nextAnswers, currentIndex);

      if (nextUnansweredIndex !== null) {
        setCurrentIndex(nextUnansweredIndex);
        setStatusMessage(`Q${currentQuestion.id}${option} locked. Moving to the next unanswered corridor.`);
        return;
      }

      setStatusMessage(`Q${currentQuestion.id}${option} locked. All 20 corridors are mapped. Review or generate your report.`);
    },
    [answers, currentIndex, questions]
  );

  const goBack = useCallback(() => {
    setCurrentIndex((value) => getPreviousQuestionIndex(value));
    setStatusMessage('Review mode. You can replace a previous answer.');
  }, []);

  const reviewFromStart = useCallback(() => {
    setCurrentIndex(0);
    setStatusMessage('Review mode opened from corridor 1. Replace any answer before generating the report.');
  }, []);

  const undoLastAnswer = useCallback(() => {
    const lastAnsweredIndex = getLastAnsweredQuestionIndex(questions, answers);

    if (lastAnsweredIndex === null) {
      setStatusMessage('No answer to undo yet.');
      return;
    }

    const question = questions[lastAnsweredIndex];

    if (!question) {
      return;
    }

    setAnswers((value) => removeAnswerForQuestion(value, question.id));
    setCurrentIndex(lastAnsweredIndex);
    setStatusMessage(`Q${question.id} cleared. Choose again.`);
  }, [answers, questions]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const option = parseKeyboardOptionKey(event.key);

      if (option !== null) {
        event.preventDefault();
        selectAnswer(option);
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

  return (
    <main className="page-shell quiz-shell">
      <section className="panel quiz-card quiz-card-polished" aria-labelledby="quiz-title">
        <div className="quiz-topbar">
          <div>
            <span className="kicker">Corridor {progress.currentCorridor} / {progress.totalCorridors}</span>
            <p>{progress.progressPercent}% mapped · {progress.answeredCount} answered</p>
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

        <div className="instruction-strip quiz-instruction-strip" aria-label="Quiz rules">
          <span>Choose quickly.</span>
          <span>No “depends.”</span>
          <span>{statusSummary.keyboardHint}</span>
        </div>

        <div className="quiz-question-block">
          <p className="kicker">Question {currentQuestion.id}</p>
          <h2 id="quiz-title">{currentQuestion.text}</h2>
          <p className="lede">One answer only. Answers are local until you generate the report.</p>
        </div>

        <div className="option-grid quiz-option-grid">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option.key;

            return (
              <button
                aria-pressed={isSelected}
                className={buildOptionButtonClassName(isSelected)}
                key={option.key}
                onClick={() => selectAnswer(option.key)}
                type="button"
              >
                <span className="option-key">{option.key}</span>
                <span className="option-text">{option.text}</span>
                <span className="option-hint">Tap or press {option.key}</span>
              </button>
            );
          })}
        </div>

        {completionPanel.isVisible ? (
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

        <div className="review-strip quiz-review-strip" aria-label="Answer review">
          {reviewDots.map((dot, index) => (
            <button
              aria-current={dot.isCurrent ? 'step' : undefined}
              aria-label={dot.ariaLabel}
              className={dot.className}
              key={dot.questionId}
              onClick={() => {
                setCurrentIndex(index);
                setStatusMessage('Review mode. You can replace this answer.');
              }}
              title={dot.title}
              type="button"
            >
              {dot.label}
            </button>
          ))}
        </div>

        <div className="actions quiz-actions">
          <button className="button secondary" disabled={progress.isFirst} onClick={goBack} type="button">
            Previous
          </button>
          <button className="button secondary" disabled={answeredCount === 0} onClick={undoLastAnswer} type="button">
            Undo last answer
          </button>
          <button className="button" disabled={!progress.isComplete} onClick={generateResult} type="button">
            Generate report
          </button>
        </div>
        <p className="small live-status" aria-live="polite">{statusMessage}</p>
      </section>
    </main>
  );
}
