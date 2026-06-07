/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

type Player = 'X' | 'O' | null;

interface LogEntry {
  id: number;
  message: string;
  success: boolean;
}

// Ensure TypeScript knows about Telegram WebApp
declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [scores, setScores] = useState({ X: 12, O: 9 });
  const [playerName, setPlayerName] = useState<string>("Player 01");
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, message: "POS_0,0 -> X", success: true },
    { id: 2, message: "POS_1,1 -> O", success: true },
    { id: 3, message: "POS_0,1 -> X", success: true },
    { id: 4, message: "POS_1,1 -> O", success: false }
  ]);
  const [winner, setWinner] = useState<Player>(null);
  const [aiMode, setAiMode] = useState<boolean>(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user?.first_name) {
        setPlayerName(user.first_name);
      }
    }
  }, []);

  useEffect(() => {
    // Basic AI Turn
    if (aiMode && !xIsNext && !winner) {
      const timer = setTimeout(() => {
        const emptyIndices = board.map((cell, index) => (cell === null ? index : null)).filter((val) => val !== null) as number[];
        if (emptyIndices.length > 0) {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleSquareClick(randomIndex);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board, xIsNext, winner, aiMode]);
  
  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
  }

  const handleSquareClick = (index: number) => {
    if (winner) return;
    
    const row = Math.floor(index / 3);
    const col = index % 3;
    
    if (board[index]) {
      setLogs(prev => [...prev, {
          id: Date.now(),
          message: `POS_${row},${col} -> ${xIsNext ? 'X' : 'O'}`,
          success: false
      }]);
      return;
    }

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    
    setLogs(prev => [...prev, {
      id: Date.now(),
      message: `POS_${row},${col} -> ${xIsNext ? 'X' : 'O'}`,
      success: true
    }]);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
       setWinner(newWinner);
       if (newWinner === 'X') {
           setScores(s => ({...s, X: s.X + 1}));
       } else {
           setScores(s => ({...s, O: s.O + 1}));
       }
    } else {
        setXIsNext(!xIsNext);
    }
  };

  const resetSession = () => {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setXIsNext(true);
      setLogs([]);
  };

  const currentPlayer = xIsNext ? 'X' : 'O';

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans flex flex-col select-none overflow-x-hidden">
      <header className="border-b-4 border-black p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
        <div>
          <h1 className="text-7xl sm:text-[120px] leading-[0.8] font-black uppercase tracking-tighter">
            TIC<br/>TAC<br/>TOE
          </h1>
          <p className="mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-60">V.2.0.4 / Distributed Systems Edition</p>
        </div>
        <div className="flex gap-8 sm:gap-12 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{playerName} (X)</span>
            <span className="text-6xl sm:text-7xl font-black italic">{scores.X.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{aiMode ? "System AI" : "Player 02"} (O)</span>
            <span className="text-6xl sm:text-7xl font-black italic">{scores.O.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-[600px] border-b-4 lg:border-b-0 lg:border-r-4 border-black p-6 sm:p-12 flex items-center justify-center">
          <div className="grid grid-cols-3 w-full max-w-[500px] aspect-square border-4 border-black bg-black gap-2">
            {board.map((cell, index) => {
              const isX = cell === 'X';
              return (
                <button
                  key={index}
                  onClick={() => handleSquareClick(index)}
                  className="bg-[#F5F5F0] flex items-center justify-center text-6xl sm:text-[120px] font-black group focus:outline-none focus:bg-gray-200 transition-colors cursor-pointer"
                >
                  {cell ? (
                      <span className={isX ? 'text-[#FF4E00]' : 'text-[#00FF00]'}>{cell}</span>
                  ) : (
                      <span className="opacity-0 group-hover:opacity-10 italic transition-opacity text-black">
                          {xIsNext ? 'X' : 'O'}
                      </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className={`p-6 sm:p-8 border-b-4 border-black flex justify-between items-center transition-colors ${winner ? 'bg-[#FF4E00] text-white' : 'bg-[#00FF00] text-black'}`}>
            <span className="font-black uppercase tracking-tighter text-xl sm:text-2xl">
              {winner ? 'Winner Detected:' : 'Current Turn:'}
            </span>
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-black flex items-center justify-center font-black text-xl sm:text-2xl bg-white text-black">
              {winner ? winner : currentPlayer}
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 flex flex-col min-h-[400px]">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Match Logs</h3>
            <div className="space-y-4 flex-1 max-h-[300px] overflow-y-auto pr-4">
              {logs.map((log, i) => (
                <div key={log.id} className="flex justify-between items-center border-b border-black/10 pb-2">
                  <span className="font-mono text-xs sm:text-sm">{(i + 1).toString().padStart(2, '0')}. {log.message}</span>
                   <span className={`text-[8px] sm:text-[10px] uppercase font-bold ${log.success ? 'text-gray-400' : 'text-red-500'}`}>
                     {log.success ? 'Success' : 'Illegal Move'}
                   </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="font-mono text-sm opacity-40">Awaiting player input...</div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <button 
                onClick={() => setAiMode(!aiMode)}
                className={`w-full p-4 font-black uppercase tracking-widest transition-colors cursor-pointer text-sm sm:text-base border-4 border-black ${aiMode ? 'bg-[#00FF00] text-black' : 'bg-transparent text-black hover:bg-black hover:text-white'}`}
              >
                {aiMode ? 'AI Mode: Enabled' : 'AI Mode: Disabled'}
              </button>
              <button 
                onClick={resetSession} 
                className="w-full bg-black text-white p-4 font-black uppercase tracking-widest hover:bg-[#FF4E00] transition-colors cursor-pointer text-sm sm:text-base"
              >
                {winner ? 'Start New Match' : 'Reset Session'}
              </button>
              <button 
                onClick={() => setScores({X: 0, O: 0})}
                className="w-full border-4 border-black p-4 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
              >
                Clear Statistics
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black text-[#F5F5F0] p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 border-t-4 border-black">
        <div className="flex gap-4 sm:gap-8 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-center sm:text-left">
          <span>ALOKTONOVA CORE</span>
          <span className="opacity-40">TIC-TAC-TOE_MOD_2023</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse"></div>
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">System Online</span>
        </div>
      </footer>
    </div>
  );
}
