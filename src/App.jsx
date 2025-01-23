import { useState, useEffect, useCallback } from 'react';
import axios from './axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2'
import 'sweetalert2/src/sweetalert2.scss'
import 'animate.css';
import './App.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, RefreshCcw, Star } from 'lucide-react';

import { Toaster, toast } from 'react-hot-toast';
import HighestScoredUsers from './components/HighestScoredUsers';
import Reviews from './components/Reviews';

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
  const [score, setScore] = useState(0);
  const [globalHighestScore, setGlobalHighestScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [, setSpeed] = useState(1000);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [stats, setStats] = useState({});

  const text = "Tetris Game";
  const user = JSON.parse(localStorage.getItem('user') || '[]');
  const userHighestScore = user?.highestScore || 0;

  const formik = useFormik({
    initialValues: {
      fullname: '',
      email: '',
    },
    validationSchema: Yup.object({
      fullname: Yup.string().required('Fullname should not be empty'),
      email: Yup.string().email('Invalid email address').required('E-mail address is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/user', values);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsModalOpen(false);
        Swal.fire({
          width: 600,
          html: `
            <h1 style="color: #716add; font-size: 2em;margin:16px 0">Instructions</h1>
            <p>To play the game, you need to click on &#9658; Start Game.</p>
            <p>You can also click on the ← and → buttons to move the block left or right.</p>
            <p>To rotate the block(Tetromino), you need to click on Spacebar button.</p>
            <p>If you want to reset the game, you can click on the ↻ Reset Game button.</p>
            <p style="margin:16px 0">Good luck!</p>
          `,
          padding: "3em",
          color: "#ccc",
          background: "rgba(0,0,0,0.9)",
          confirmButtonText: "Let's go!",
          showClass: {
            popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `
          },
          hideClass: {
            popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      } catch (error) {
        console.error('Error submitting user data:', error);
      }
    },
  });

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
  const calculateSpeed = (score) => {
    if (score >= 30000) return 350;
    if (score >= 20000) return 500;
    if (score >= 14000) return 600;
    if (score >= 9000) return 700;
    if (score >= 5000) return 800;
    if (score >= 2000) return 900;
    return 1000;
  };
  const placeTetromino = useCallback(async () => {
    const newTetromino = randomTetromino();
    setTetromino(newTetromino);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2), y: 0 });

    if (checkCollision(board, newTetromino.shape, { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2), y: 0 })) {
      setGameOver(true);
      await axios.post('/stats', { gamesPlayed: 1 });
      if (score > highScore) {
        const response = await axios.put('/user/' + JSON.parse(localStorage.getItem('user'))._id, { score });
        localStorage.setItem('user', JSON.stringify(response.data));
        toast.success('New High Score!');
        setHighScore(score);

        if (globalHighestScore < score) {
          Swal.fire({
            title: "New Global High Score!",
            width: 600,
            padding: "3em",
            color: "#fff",
            background: "rgba(0,0,0,0)",
            confirmButtonText: "Awesome",
            backdrop: `
              rgba(0,0,123,0.4)
              url(https://media.tenor.com/-AyTtMgs2mMAAAAi/nyan-cat-nyan.gif)
              left top
              no-repeat
            `,
            showClass: {
              popup: `
                animate__animated
                animate__fadeInUp
                animate__faster
              `
            },
            hideClass: {
              popup: `
                animate__animated
                animate__fadeOutDown
                animate__faster
              `
            }
          });
        }
      }
    }
  }, [board, globalHighestScore, highScore, score]);

  const checkCollision = (board, tetromino, position) => {
    for (let y = 0; y < tetromino.length; y++) {
      for (let x = 0; x < tetromino[y].length; x++) {
        if (
          tetromino[y][x] &&
          (board[position.y + y] === undefined ||
            board[position.y + y][position.x + x] === undefined ||
            board[position.y + y][position.x + x])
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const clearLines = (board) => {
    let linesCleared = 0;
    const newBoard = board.filter((row) => {
      if (row.every((cell) => cell !== 0)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    for (let i = 0; i < linesCleared; i++) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    if (linesCleared === 1) {
      setScore((prev) => prev + 100);
    }
    if (linesCleared === 2) {
      setScore((prev) => prev + 250);
    }
    if (linesCleared === 3) {
      setScore((prev) => prev + 400);
    }
    if (linesCleared === 4) {
      setScore((prev) => prev + 600);
    }

    return newBoard;
  };

  const resetGame = () => {
    setBoard(createBoard());
    setScore(0);
    setSpeed(1000);
    setIsGameStarted(false);
    placeTetromino();
    const updatedUser = JSON.parse(localStorage.getItem('user'));
    setGameOver(false);
    if (updatedUser) {
      setHighScore(updatedUser.highestScore || 0);
    }
  };

  const startGame = () => {
    setIsGameStarted(true);
    setGameOver(false);
    placeTetromino();
  };
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isGameStarted || gameOver) return;

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
        const rotatedShape = rotateTetromino(tetromino.shape);
        if (!checkCollision(board, rotatedShape, position)) {
          setTetromino((prev) => ({ ...prev, shape: rotatedShape }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tetromino, position, board, gameOver, isGameStarted]);

  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      if (!tetromino) return;

      const newY = position.y + 1;
      if (!checkCollision(board, tetromino.shape, { x: position.x, y: newY })) {
        setPosition((prev) => ({ ...prev, y: newY }));
      } else {
        const newBoard = board.map((row) => [...row]);
        tetromino.shape.forEach((row, dy) => {
          row.forEach((value, dx) => {
            if (value) {
              newBoard[position.y + dy][position.x + dx] = tetromino.key;
            }
          });
        });

        const clearedBoard = clearLines(newBoard);
        setBoard(clearedBoard);

        placeTetromino();
      }
    }, calculateSpeed(score));

    return () => clearInterval(gameLoop);
  }, [tetromino, position, board, placeTetromino, gameOver, isGameStarted, score]);

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
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setIsModalOpen(true);
    }
  }, []);
  useEffect(() => {
    const fetchGlobalHighestScore = async () => {
      try {
        const response = await axios.get('/user/globalHighestScore');
        setGlobalHighestScore(response.data.highestScore);
      } catch (error) {
        console.error('Error fetching global highest score:', error);
      }
    }
    fetchGlobalHighestScore();
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className='w-full min-h-screen'>
      <div className="flex flex-col justify-center items-center min-h-screen py-6 bg-gray-900">
        {/* Stats */}
        <AnimatePresence mode='popLayout'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 1 }} className="flex justify-center items-center mb-6">
            <div className="flex flex-col items-center">
              <div className='flex items-center justify-end gap-6 px-10'>
                <h2 className="text-2xl font-bold">Tetris stats</h2>
                <span className="font-bold text-gray-600">Users: {stats.users}</span>
                <span className="font-bold text-gray-600">Reviews: {stats.reviews}</span>
                <span className="font-bold text-gray-600">Games Played: {stats.gamesPlayed}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Key Guide */}
        <div className="text-white text-center mb-8">
          <h1 className="flex items-center justify-center text-4xl font-bold mb-4 text-orange-500">
            <img src='tetris.png' className='w-10' />{text}
          </h1>
          <p className="text-lg">
            <span className="font-bold">←</span> Move Left | <span className="font-bold">→</span> Move Right |{' '}
            <span className="font-bold">↓</span> Move Down | <span className="font-bold">Spacebar</span> Rotate
          </p>
        </div>

        {/* Game Board and Score */}
        <div className='flex w-full max-w-4xl min-w-[660px] flex-col gap-4 p-6 bg-gray-800 rounded-lg'>
          <HighestScoredUsers score={score} />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
              className="flex w-full max-w-4xl justify-center gap-8 p-6 border-dotted bg-gradient-to-br bg-gray-900  shadow-2xl rounded-lg px-2"  >
              <div className="grid grid-rows-20 grid-cols-10 gap-1 bg-gray-900 rounded-lg shadow-inner">
                {renderBoard().map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`${y}-${x}`}
                      className={`w-7 h-7 transition-all duration-100 ${cell ? `bg-green-500 hover:bg-green-400` : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    />
                  ))
                )}
              </div>
              <div className="flex flex-col justify-between p-4 bg-gray-800 rounded-lg shadow-md">
                <div>
                  <h2 className="text-3xl font-bold mb-6 uppercase text-blue-400">
                    {JSON.parse(localStorage.getItem('user'))?.fullname ?? ''}
                  </h2>
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-300">Score: {score}</h2>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-red-500">
                      <span className='flex items-center gap-2'>
                        <Star size={18} /> Highest Score:
                      </span>
                      <span>{userHighestScore}</span>
                    </h2>
                    {gameOver && (
                      <h2 className="text-2xl font-bold text-red-500 animate-pulse">
                        Game Over!
                      </h2>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col space-y-4 mt-6">
                  {!isGameStarted && (
                    <button
                      onClick={startGame}
                      className=" flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                    >
                      <Play size={18} /> Start Game
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
                  >
                    <RefreshCcw size={18} /> Reset Game
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md"
            >
              <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
                Enter Your Details
              </h2>
              <form onSubmit={formik.handleSubmit} className="space-y-6">
                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.fullname}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                    placeholder="John Doe"
                  />
                  {formik.touched.fullname && formik.errors.fullname ? (
                    <div className="text-red-400 text-sm mt-2">{formik.errors.fullname}</div>
                  ) : null}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                    placeholder="john.doe@example.com"
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <div className="text-red-400 text-sm mt-2">{formik.errors.email}</div>
                  ) : null}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        <div className="w-full max-w-4xl ">
          <Reviews stars={stats.stars} />
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;