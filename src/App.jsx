import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import sudoku from "sudoku";
import "./App.css";

const rightBox = [2, 11, 20, 29, 38, 47, 56, 65, 74, 5, 14, 23, 32, 41, 50, 59, 68, 77];
const topBox = [27, 28, 29, 30, 31, 32, 33, 34, 35, 54, 55, 56, 57, 58, 59, 60, 61, 62];

function App() {
  const box = useRef([]);
  const [state, setState] = useState({
    puzzle: [],
    solution: [],
  });
  const [mistake, setMistake] = useState(0);
  const [countHint, setCountHint] = useState(0);
  const [restart, setRestart] = useState(null);
  const [numbering, setNumbering] = useState({});
  const [isFinish, setIsFinish] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [isAutoSolved, setIsAutoSolved] = useState(false);
  // watch reply
  useEffect(() => {
    if (state.puzzle.length) {
      let fiterNull = state.puzzle.filter((item, i) => {
        return item.value === null
      })
      if (fiterNull.length === 0) {
        setIsFinish(true)
      }
      if (fiterNull.length === 5) {
        setIsAutoSolved(true)
      }
      console.log({fiterNull})
    }
  }, [state.puzzle]);
  // start
  useEffect(() => {
    console.clear();
    var puzzle = sudoku.makepuzzle();
    var solution = sudoku.solvepuzzle(puzzle);
    var number = makeNumbering()
    puzzle = puzzle.map((item, i) => {
      if (item === 0) {
        item = 9
      }
      if (item) {
        number[item] -= 1;
      }
      return {
        value: item,
        disabled: Boolean(item)
      };
    });
    solution = solution.map((item, i) => {
      if (item === 0) {
        item = 9;
      }
      return item;
    })
    setState({ puzzle, solution });
    setMistake(0);
    setCountHint(0);
    setNumbering(number);
    setIsFinish(false);
    setIsSurrender(false);
    setIsAutoSolved(false);
    console.log({ puzzle, solution, number });
  }, [restart]);
  const isLose = useMemo(() => {
    return (mistake >= 3 || countHint >= 3);
  }, [mistake, countHint]);
  // surrender
  const surrender = useCallback(() => {
    let puzzle = state.solution.map((item, i) => {
      return {
        value: item,
        disabled: false,
      };
    });
    setState((current) => ({ ...current, puzzle }));
    setNumbering(makeNumbering(true))
    setIsSurrender(true)
  }, [state.solution]);
  const restartPuzzle = useCallback(() => {
    setRestart(Date.now());
  }, []);
  const focused = useCallback(
    (e, hintData) => {
      if (e.target.value) {
        box.current.forEach((item, i) => {
          if (item.value === e.target.value) {
            item.classList.add("focus");
            if (hintData === i) {
              item.classList.add("hint")
            }
            else {
              item.classList.remove("hint");
            }
          } else {
            item.classList.remove("focus", "hint");
          }
        });
      }
    },
    [box.current]
  );
  // input
  const handle = useCallback(
    (e, i, hintData) => {
      let value = parseInt(e.target.value);
      if ((!e.target.value.match(/[1-9]/) && e.target.value !== "") || e.target.value.length >= 2 || mistake >= 3)
        return;
      let isError = false, newState = {}
      function solution() {
        if (!e.target.value.length) return;
        let findSolution = state.solution.filter((d, index) => index === i);
        if (findSolution.length === 1) {
          findSolution = findSolution[0];
          if (findSolution === value) return;
          isError = true;
          setMistake(mistake + 1);
          console.log({findSolution});
        }
      }
      solution();
      newState = {
        ...state,
        puzzle: state.puzzle.map((item, index) => {
          if (index === i && !item.disabled) {
            item = { ...item, value };
            item.isError = isError;
            return item;
          }
          return item;
        }),
      };
      setState(newState);
      if (!isError) {
        setNumbering((current) => {
          let data = { ...current };
          if (e.target.value) {
            data[e.target.value] = data[e.target.value] -= 1;
          }
          console.log({value: e.target.value, data})
          return data;
        });
      }
      setTimeout(() => {
        focused({
          target: { value: e.target.value },
        }, hintData);
      }, 200)
    },
    [mistake, focused, state]
  );
  // disable on mistake
  useEffect(() => {
    if (isLose) {
      box.current.forEach((item, i) => {
        item.setAttribute("disabled", true);
      });
    }
  }, [isLose, box.current]);
  // hint
  const hint = useCallback((e) => {
    if (countHint >= 3) return;
    let freeBox = []
    state.puzzle.forEach((item, i) => {
      if (item.value === null) {
        freeBox.push(i)
      }
    })
    let rand = Math.floor(Math.random() * freeBox.length),
      solution = String(state.solution[freeBox[rand]]);
    // console.log({freeBox, rand, solution})
    handle({
      target: { value: solution }
    }, freeBox[rand], freeBox[rand])
    setCountHint(countHint + 1)
  }, [state, countHint]);
  // auto solving
  const autoSolve = useCallback(() => {
    let fiterNull = state.puzzle.filter((item, i) => {
      return item.value === null
    })
    if (fiterNull.length <= 5) return;
    let puzzle = state.solution.map((item, i) => {
      return {
        value: item,
        disabled: false,
      };
    });
    setState({...state, puzzle});
    setIsFinish(true);
  }, [state]);
  // drag & drop
  function handleDragStart(e) {
    e.target.style.opacity = "0.4";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.querySelector("span:nth-child(2)").innerHTML);
  }
  function handleDragEnd(e) {
    e.target.style.opacity = "1";
  }
  function handleDrop(e, i) {
    e.stopPropagation();
    let isDisable = e.target.classList.contains('disable');
    if (isDisable) return;
    let value = e.dataTransfer.getData("text/html");
    handle(
      {
        target: {
          value,
        },
      },
      i
    );
    return false;
  }
  function onDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }
  return (
    <div className="App">
      <div className="title">
        <p align="center">Sudoku By Ferdiansyah0611</p>
      </div>
      <section className="info">
        {
          !isSurrender ?
          <>
            {isLose ? (
              <div className="lose">
                <p>You Lose</p>
              </div>
            ) : (
              false
            )}
            {
              !isLose && isFinish ?
                <div className="win">
                  <p>You Win</p>
                </div>
              : false
            }
          </>
          : false
        }
        <div className="limit">
          <p className={"mistake"}>{mistake}/3 mistake</p>
          <p className={"mistake"} align={"right"}>{countHint}/3 hint</p>
        </div>
      </section>
      <section className="body">
        {state.puzzle.map((item, i) => (
          <div key={i}>
            <input
              ref={(el) => (box.current[i] = el)}
              onClick={focused}
              value={item.value ? item.value : ""}
              onChange={(e) => handle(e, i)}
              type="text"
              className={[
                item.disabled ? "disable" : "",
                item.isError ? "error" : "",
                rightBox.includes(i) ? "right" : "",
                topBox.includes(i) ? "top" : "",
              ].join(" ")}
              onDrop={(e) => handleDrop(e, i)}
              onDragOver={onDragOver}
              inputmode="numeric"
            />
          </div>
        ))}
      </section>
      <section className="choice">
        {Object.keys(numbering).map((item, i) => {
          return (
            <button
              disabled={numbering[i + 1] === 0}
              draggable={numbering[i + 1] >= 1}
              key={i}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={(e) => focused({
                target: { value: String(i + 1) }
              })}
            >
              <span>{numbering[i + 1]}</span>
              <span>{i + 1}</span>
            </button>
          );
        })}
      </section>
      <section className="action">
        <div>
          <button onClick={restartPuzzle}>Restart</button>
          <button onClick={surrender}>Surrender</button>
          <button onClick={hint}>Hint</button>
        </div>
      </section>

      <div className={"faster" + (isAutoSolved ? " open": "")}>
        <button onClick={autoSolve}>Auto Solve</button>
      </div>
    </div>
  );
}

function makeNumbering(isZero){
  let number = {}
  for (let i = 1; i <= 9; i++) {
      if (isZero) {
        number[i] = 0;
      }
      else {
        number[i] = 9;
      }
    }
    return number;
}

export default App;
