'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCorridorQuestions, runCorridorsEngine, type CorridorsOptionKey } from '@/core';
import {
  buildCorridorAnswerSequence,
  calculateQuizProgress,
  getLastAnsweredQuestionIndex,
  getNextQuestionIndex,
  getPreviousQuestionIndex,
  parseKeyboardOptionKey,
  removeAnswerForQuestion,
  saveCorridorsResultToSessionStorage,
  type DraftCorridorsAnswers
} from './quizFlow';

export function QuizClient() {
  const router = useRouter();
  const questions = useMemo(() => getCorridorQuestions(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<DraftCorridorsAnswers>({});
  const [statusMessage, setStatusMessage] = useState('Choose quickly. One answer only. Keyboard: A/B/C/D.');
  const maybeCurrentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(answers).length;
  const progress = calculateQuizProgress(currentIndex, questions.length, answeredCount);

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
      setStatusMessage(`Q${currentQuestion.id}${option} locked. You can undo or review before finishing.`);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((value) => getNextQuestionIndex(value, questions.length));
        return;
      }

      try {
        const answerSequence = buildCorridorAnswerSequence(questions, nextAnswers);
        const result = runCorridorsEngine(answerSequence);
        saveCorridorsResultToSessionStorage(window.sessionStorage, result);
        router.push('/results');
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Could not complete the corridor map.');
      }
    },
    [answers, currentIndex, questions, router]
  );

  const goBack = useCallback(() => {
    setCurrentIndex((value) => getPreviousQuestionIndex(value));
    setStatusMessage('Review mode. You can replace a previous answer.');
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
  }, [goBack, selectAnswer, undoLastAnswer]);

  if (!maybeCurrentQuestion) {
    return (
      <main className="page-shell quiz-shell">
        <section className="panel quiz-card">
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
      <section className="panel quiz-card" aria-labelledby="quiz-title">
        <div className="progress-row">
          <span className="kicker">Corridor {progress.currentCorridor} / {progress.totalCorridors}</span>
          <span>{progress.progressPercent}% mapped · {progress.answeredCount} answered</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress.progressPercent}%` }} />
        </div>

        <div className="instruction-strip" aria-label="Quiz rules">
          <span>Choose quickly.</span>
          <span>No “depends.”</span>
          <span>Keys: A/B/C/D · Backspace undo · ← review</span>
        </div>

        <h2 id="quiz-title">{currentQuestion.text}</h2>
        <p className="lede">One answer only. You may review or undo before the final corridor is submitted.</p>
        <div className="option-grid">
          {currentQuestion.options.map((option) => (
            <button
              aria-pressed={selectedOption === option.key}
              className={selectedOption === option.key ? 'option-button selected' : 'option-button'}
              key={option.key}
              onClick={() => selectAnswer(option.key)}
              type="button"
            >
              <span className="option-key">{option.key}</span>
              <span>{option.text}</span>
            </button>
          ))}
        </div>

        <div className="review-strip" aria-label="Answer review">
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const isCurrent = index === currentIndex;
            const label = answer === undefined ? `Q${question.id}` : `Q${question.id}${answer}`;

            return (
              <button
                aria-current={isCurrent ? 'step' : undefined}
                className={isCurrent ? 'review-dot current' : answer === undefined ? 'review-dot' : 'review-dot answered'}
                key={question.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setStatusMessage('Review mode. You can replace this answer.');
                }}
                title={label}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="actions">
          <button className="button secondary" disabled={progress.isFirst} onClick={goBack} type="button">
            Previous
          </button>
          <button className="button secondary" disabled={answeredCount === 0} onClick={undoLastAnswer} type="button">
            Undo last answer
          </button>
        </div>
        <p className="small live-status" aria-live="polite">{statusMessage}</p>
      </section>
    </main>
  );
}
