import { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]] },
  O: { shape: [[1, 1], [1, 1]] },
  T: { shape: [[0, 1, 0], [1, 1, 1]] },
  S: { shape: [[0, 1, 1], [1, 1, 0]] },
  Z: { shape: [[1, 1, 0], [0, 1, 1]] },
  J: { shape: [[1, 0, 0], [1, 1, 1]] },
  L: { shape: [[0, 0, 1], [1, 1, 1]] },
};

const createBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

const App = () => {
  const [board, setBoard] = useState(createBoard());
  const [tetromino, setTetromino] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const randomTetromino = () => {
    const keys = Object.keys(TETROMINOES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return { ...TETROMINOES[randomKey], key: randomKey };
  };

  const rotateTetromino = (shape) => {
    const N = shape.length;
    const rotated = Array.from({ length: shape[0].length }, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        rotated[x][N - 1 - y] = shape[y][x];
      }
    }
    return rotated;
  };

  const placeTetromino = useCallback(() => {
    const newTetromino = randomTetromino();
    setTetromino(newTetromino);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2), y: 0 });
    setRotation(0);

    // Check if the new tetromino immediately collides (game over)
    if (checkCollision(board, newTetromino.shape, { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2), y: 0 })) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
      }
    }
    setSpeed((prev) => prev - 10);
  }, [board, highScore, score]);

  const checkCollision = (board, tetromino, position) => {
    for (let y = 0; y < tetromino.length; y++) {
      for (let x = 0; x < tetromino[y].length; x++) {
        if (
          tetromino[y][x] &&
          (board[position.y + y] === undefined ||
            board[position.y + y][position.x + x] === undefined ||
            board[position.y + y][position.x + x])
        ) {
          return true; // Collision detected
        }
      }
    }
    return false; // No collision
  };

  const clearLines = (board) => {
    let linesCleared = 0;
    const newBoard = board.filter((row) => {
      if (row.every((cell) => cell !== 0)) {
        linesCleared++;
        return false; // Remove this line
      }
      return true;
    });

    // Add empty rows at the top
    for (let i = 0; i < linesCleared; i++) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    // Update score
    if (linesCleared > 0) {
      setScore((prev) => prev + linesCleared * 100);
    }

    return newBoard;
  };

  const resetGame = () => {
    setBoard(createBoard());
    setScore(0);
    setGameOver(false);
    placeTetromino();
    setSpeed(1000);
  };

  useEffect(() => {
    placeTetromino();
  }, [placeTetromino]);

  useEffect(() => {
    if (gameOver) return;

    const handleKeyDown = (e) => {
      if (!tetromino) return;

      if (e.key === 'ArrowLeft') {
        const newX = Math.max(position.x - 1, 0);
        if (!checkCollision(board, tetromino.shape, { x: newX, y: position.y })) {
          setPosition((prev) => ({ ...prev, x: newX }));
        }
      } else if (e.key === 'ArrowRight') {
        const newX = Math.min(position.x + 1, BOARD_WIDTH - tetromino.shape[0].length);
        if (!checkCollision(board, tetromino.shape, { x: newX, y: position.y })) {
          setPosition((prev) => ({ ...prev, x: newX }));
        }
      } else if (e.key === 'ArrowDown') {
        const newY = position.y + 1;
        if (!checkCollision(board, tetromino.shape, { x: position.x, y: newY })) {
          setPosition((prev) => ({ ...prev, y: newY }));
        }
      } else if (e.key === ' ') {
        // Rotate tetromino on spacebar
        const rotatedShape = rotateTetromino(tetromino.shape);
        if (!checkCollision(board, rotatedShape, position)) {
          setTetromino((prev) => ({ ...prev, shape: rotatedShape }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tetromino, position, board, gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      if (!tetromino) return;

      const newY = position.y + 1;
      if (!checkCollision(board, tetromino.shape, { x: position.x, y: newY })) {
        setPosition((prev) => ({ ...prev, y: newY }));
      } else {
        // Lock the tetromino in place
        const newBoard = board.map((row) => [...row]);
        tetromino.shape.forEach((row, dy) => {
          row.forEach((value, dx) => {
            if (value) {
              newBoard[position.y + dy][position.x + dx] = tetromino.key;
            }
          });
        });

        // Clear completed lines
        const clearedBoard = clearLines(newBoard);
        setBoard(clearedBoard);

        // Spawn a new tetromino
        placeTetromino();
      }

    }, speed);

    return () => clearInterval(gameLoop);
  }, [tetromino, position, board, placeTetromino, gameOver, speed]);

  const renderBoard = () => {
    const newBoard = board.map((row) => [...row]);

    if (tetromino) {
      tetromino.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value && newBoard[position.y + dy] && newBoard[position.y + dy][position.x + dx] !== undefined) {
            newBoard[position.y + dy][position.x + dx] = tetromino.key;
          }
        });
      });
    }

    return newBoard;
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900">
      {/* Key Guide */}
      <div className="text-white text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Tetris Game</h1>
        <p className="text-lg">
          <span className="font-bold">←</span> Move Left | <span className="font-bold">→</span> Move Right |{' '}
          <span className="font-bold">↓</span> Move Down | <span className="font-bold">Space</span> Rotate
        </p>
      </div>

      {/* Game Board and Score */}
      <div className="flex gap-8">
        <div className="grid grid-rows-20 grid-cols-10 gap-1">
          {renderBoard().map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`w-6 h-6 ${cell ? `bg-green-500` : 'bg-gray-700'}`}
              />
            ))
          )}
        </div>
        <div className="text-white">
          <h2 className="text-2xl font-bold">Score: {score}</h2>
          <h2 className="text-2xl font-bold mt-4">High Score: {highScore}</h2>
          {gameOver && <h2 className="text-2xl font-bold mt-4 text-red-500">Game Over!</h2>}
          <button
            onClick={resetGame}
            className="mt-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;