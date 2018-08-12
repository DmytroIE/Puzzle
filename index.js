/* eslint-disable */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-template */
/* eslint-disable no-unused-vars */

class Puzzle {
  constructor(node, picturePath, divider, strategy) {
    this.divider = divider;
    this.strategy = strategy;
    // флаг того, что процесс уже запущен
    this.isProcessRun = false;
    this.processTimer = 0;
    // массив ссылок на объекты, которые имеют связь с div'ами, в которых кусочки картинки
    this.items = [];

    //  создаем поле из клеточек
    this.itemWidth = Number.parseInt(node.style.width) / divider;
    this.itemHeight = Number.parseInt(node.style.height) / divider;

    node.style.position = 'relative'; // на всякий случай
    node.style.backgroundColor = '#555'; //

    for (let i = 0; i < divider * divider - 1; i++) {
      // вначале создаем DOM-элемент
      const cell = document.createElement('div');

      // потом создаем его двойника, который будет участвовать в вычислительном цикле
      this.items[i] = {
        left: (i % divider) * this.itemWidth,
        top: Math.trunc(i / divider) * this.itemHeight,
        index: i,
        link: cell,
      };

      // теперь заполняем DOM-элемент
      cell.style.position = 'absolute';
      cell.style.boxSizing = 'border-box';
      cell.style.width = this.itemWidth + 'px';
      cell.style.height = this.itemHeight + 'px';
      cell.style.border = '1px solid black';
      cell.style.backgroundImage = `url(${picturePath})`;

      cell.style.backgroundPositionX = `${((i % divider) / (divider - 1)) * 100}%`;
      cell.style.backgroundPositionY = `${(Math.trunc(i / divider) / (divider - 1)) * 100}%`;

      cell.style.left = `${this.items[i].left}px`;
      cell.style.top = `${this.items[i].top}px`;

      node.appendChild(cell);
    }
    // в последнюю ячейку массива записываем hole, похожий на остальные узлы
    // добавим к объекту массива переменную, которая показывает, где искать hole
    this.items.holeIndex = divider * divider - 1;
    // ти записываем hole в таком же формате, как и остальные узлы (дляудобства работы)
    this.items[this.items.holeIndex] = {
      left: (this.items.holeIndex % divider) * this.itemWidth,
      top: Math.trunc(this.items.holeIndex / divider) * this.itemHeight,
      index: this.items.holeIndex,
    };
  }

  shiftCells(time) {
    // вначале запускаем стратегию, которая выберет ячейку для перемещения
    const newHoleIdx = this.strategy.shift(this.divider, this.items.holeIndex);

    // Определяем направление движения
    const direction =
      newHoleIdx === this.items.holeIndex - 1 ||
      newHoleIdx === this.items.holeIndex + 1
        ? 'left'
        : 'top';

    let distance =
      this.items[this.items.holeIndex][direction] -
      this.items[newHoleIdx][direction];

    // величина смещения ячейки за один прогон. По дефолту равна 1 пикселю
    const pix = distance > 0 ? 1 : -1;

    // по distance будем вести обратный отсчет
    distance = Math.abs(distance);

    // теперь нужно выбрать интервал времени для перемещения на 1 пиксель.
    // Он не должен быть больше time/distance, потому запас 20%

    const timeInterval = Math.trunc((time / distance) * 0.8 * Math.abs(pix));

    // еще некоторые приготовления
    // запишем координаты ячейки во временные переменные, чтобы потом их использовать
    const tempLeft = this.items[newHoleIdx].left;
    const tempTop = this.items[newHoleIdx].top;

    // теперь сама анимация

    const timerId = setInterval(() => {
      if (distance >= 1 && this.isProcessRun) {
        this.items[newHoleIdx][direction] += pix;
        this.items[newHoleIdx].link.style[direction] = this.items[newHoleIdx][direction] + 'px';
        distance -= Math.abs(pix); // обратный отсчет
      } else {
        // если расстояние до новой позиции меньше 1 пкс, то просто задаем ей координаты hole
        // (они-то и должны были в конце концов получиться)
        this.items[newHoleIdx].left = this.items[this.items.holeIndex].left;
        this.items[newHoleIdx].top = this.items[this.items.holeIndex].top;

        this.items[newHoleIdx].link.style.left =
          this.items[newHoleIdx].left + 'px';
        this.items[newHoleIdx].link.style.top =
          this.items[newHoleIdx].top + 'px';

        // теперь меняем в массиве местами hole и ячейку, которую мы передвинули
        // перекинем ссылку на hole во временную переменную
        const tempLink = this.items[this.items.holeIndex];

        // теперь на месте hole передвинутая ячейка
        this.items[this.items.holeIndex] = this.items[newHoleIdx];

        // а на место передвинутой ячейки записываем hole
        this.items[newHoleIdx] = tempLink;
        this.items[newHoleIdx].left = tempLeft;
        this.items[newHoleIdx].top = tempTop;
        this.items.holeIndex = newHoleIdx;

        clearInterval(timerId);
      }
    }, timeInterval);
  }

  puzzleIt(shiftTime) {
    // проверка входных данных на валидность
    this.shiftTimeLimited = shiftTime * 1000;

    if (shiftTime < 1) {
      this.shiftTimeLimited = 1000;
    }
    if (shiftTime > 20) {
      this.shiftTimeLimited = 20000;
    }

    this.isProcessRun = true;
    this.shiftCells(this.shiftTimeLimited);
    this.processTimer = setInterval(
      this.shiftCells.bind(this, this.shiftTimeLimited),
      this.shiftTimeLimited,
    );
  }

  stop() {
    clearInterval(this.processTimer);
    this.processTimer = 0;
    this.isProcessRun = false;
  }

  reset() {
    let wasProcessRunning = false;
    // вначале нужно убить внешний цикл
    if (this.isProcessRun === true) {
      wasProcessRunning = true;
      this.stop();
    }
    // это займет определенное время (пока ячейка, которая двигалась
    // в момент нажатия на reset, доедет до конца)
    // потому дальнейшие действия будем производить через, скажем, 100 мс
    setTimeout(() => {
      // приводим массив ячеек к исходному состоянию
      // вначале основные ячейки
      this.items.sort((a, b) => a.index - b.index);
      for (let i = 0; i < this.items.length - 1; i++) {
        this.items[i].left = (i % this.divider) * this.itemWidth;
        this.items[i].top = Math.trunc(i / this.divider) * this.itemHeight;
        this.items[i].link.style.left = `${this.items[i].left}px`;
        this.items[i].link.style.top = `${this.items[i].top}px`;
      }

      // а в конце дело доходит до hole
      this.items.holeIndex = this.items.length - 1;
      this.items[this.items.holeIndex].left =
        (this.items.holeIndex % this.divider) * this.itemWidth;
      this.items[this.items.holeIndex].top =
        Math.trunc(this.items.holeIndex / this.divider) * this.itemHeight;

      // если процесс был запущен вовремя нажатия reset, то его нужно возобновить
      if (wasProcessRunning) {
        this.puzzleIt(this.shiftTimeLimited / 1000);
      }
    }, 100);
  }
}

class StrategyArbitrarily {
  constructor() {
    this.neighbours = [];
    this.previouslyShifted = -2;
  }

  shift(divider, prevHole) {
    if (
      (prevHole + divider - 1) % divider !== divider - 1 &&
      prevHole - 1 !== this.previouslyShifted
    ) {
      // отсеиваются все ячейки из самой левой колонки
      this.neighbours.push(prevHole - 1); // присоединяем соседа слева
    }
    if (
      (prevHole + 1) % divider !== 0 &&
      prevHole + 1 !== this.previouslyShifted
    ) {
      // отсеиваются все ячейки из самой правой колонки
      this.neighbours.push(prevHole + 1); // присоединяем соседа справа
    }
    if (
      prevHole - divider >= 0 &&
      prevHole - divider !== this.previouslyShifted
    ) {
      this.neighbours.push(prevHole - divider); // присоединяем соседа сверху
    }
    if (
      prevHole + divider < divider * divider &&
      prevHole + divider !== this.previouslyShifted
    ) {
      this.neighbours.push(prevHole + divider); // присоединяем соседа сверху
    }
    const arbitraryNeighbour = this.neighbours[
      Math.floor(Math.random() * this.neighbours.length)
    ];
    // обнуляем массив перед следующей итерацией
    this.neighbours = [];
    // записываем номер hole, в следующий раз там будет ячейка,
    // которую нужно будет исключить из списка перемещаемых,
    // чтобы не гонять одну и ту же ячейку туда-сюда
    this.previouslyShifted = prevHole;
    // возвращаем произвольного соседа, с которым hole будет меняться местами
    return arbitraryNeighbour;
  }
}
