/* eslint-disable */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-template */
/* eslint-disable no-unused-vars */

class Puzzle {
  constructor(node, picturePath, divider, strategy) {
    this.divider = divider;
    this.strategy = strategy;

    this.isProcessRun = false; // флаг для того, чтобы, если уже процесс запущен, нельзя было второй раз вызвать функцию PuzzleIt
    this.processTimer = 0;
    
    this.items = []; // массив ссылок на объекты, которые имеют связб с div'ами, в которых кусочки картинки

    //this.hole = {left: '', top: ''}; // объект - пустая ячейка
    //this.hole.index = divider * divider - 1; // индексом для hole поначалу является последняя ячейка, ячейки нумеруем с нуля
    //  создаем поле из клеточек
    const width = Number.parseInt(node.style.width) / divider;
    const height = Number.parseInt(node.style.height) / divider;

    node.style.position = 'relative'; // на всякий случай
    node.style.backgroundColor = '#555'; //

    for (let i = 0; i < divider * divider - 1; i++) {
      const cell = document.createElement('div');
      cell.style.position = 'absolute';
      cell.style.boxSizing = 'border-box';
      cell.style.width = width + 'px';
      cell.style.height = height + 'px';
      cell.style.border = '1px solid black';
      cell.style.backgroundImage = `url(${picturePath})`;

      cell.style.backgroundPositionX = `${(i % divider)/(divider - 1) * 100}%`; // найти ошибку
      cell.style.backgroundPositionY = `${Math.trunc(i / divider)/(divider - 1) * 100}%`; // найти ошибку

      cell.style.left = `${(i % divider) * width}px`;
      cell.style.top = `${Math.trunc(i / divider) * height}px`;


      node.appendChild(cell);
      // заодно добавим инфо о положении ячейки в наш массив
      this.items[i] = {left: (i % divider) * width, top: Math.trunc(i / divider) * height, /*index: i,*/ link: cell}; // в параллельном массиве храним все в виде чисел
    }
    // в последнюю ячейку массива записываем hole, похожий на остальные узлы
    // добавим к объекту массива переменную, которая показывает, где искать hole
    this.items.holeIndex = divider * divider - 1;
    // ти записываем hole в таком же формате, как и остальные узлы (дляудобства работы)
    this.items[this.items.holeIndex] = {left: (this.items.holeIndex % divider) * width, top: Math.trunc(this.items.holeIndex / divider) * height, /*index: this.items.holeIndex*/};

    //debugger


  }

  shiftCells(time) {
    // вначале запускаем стратегию, которая выберет ячейку для перемещения
    const newHoleIdx = this.strategy.shift(this.divider, this.items.holeIndex);

    // вспомогательные переменные, одна из них должна обязательно быть равна нулю, т.к. ячейки за раз перемещаются по одному направлению
    // если новая ячейка сбоку от хол, и индекс хол нечетный, то у ячейки сбоку будет наоборот - четный. А если сверху или снизу - то такой же. 
    // Так можно поределять направление движения

    const direction = newHoleIdx === this.items.holeIndex - 1 || newHoleIdx === this.items.holeIndex + 1 ? 'left': 'top';

    let distance = this.items[this.items.holeIndex][direction] - this.items[newHoleIdx][direction];
    
    //debugger
    const pix = (distance > 0 ? 1: -1);
    
    // по distance будем вести обратный отсчет
    // в начале найдем дробный остаток
    //const remainder = distance - Number.trunc(distance)
    distance = Math.abs(distance);

    // теперь нужно выбрать интервал времени для перемещения на 1 пиксель. Он не должен быть больше time/distance

    let timeInterval = Math.trunc(time/distance*0.8);

    //alert(`timeInterval=${timeInterval}, distance=${distance}, direction=${direction}`);

    // еще некоторые приготовления
    // запишем координаты ячейки во временные переменные, чтобы потом их использовать
    const tempLeft = this.items[newHoleIdx].left;
    const tempTop = this.items[newHoleIdx].top;

    // теперь сама анимация

    let timerId = setInterval(() => {

      if ( distance >= 1 && this.isProcessRun){
        this.items[newHoleIdx][direction] += pix;
        this.items[newHoleIdx].link.style[direction] = this.items[newHoleIdx][direction] + 'px';
        distance -= Math.abs(pix); // обратный отсчет
      }
      
      else {

        // добиваем дробный остаток - поправить !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (pix > 0){
          this.items[newHoleIdx][direction] += distance;
        } 
        else {
          this.items[newHoleIdx][direction] -= distance;        
        }
        this.items[newHoleIdx].link.style[direction] = this.items[newHoleIdx][direction] + 'px';

        // теперь меняем в массиве местами hole и ячейку, которую мы передвинули

        const tempLink = this.items[this.items.holeIndex]; // перекинем ссылку на hole во временную переменную
  
        this.items[this.items.holeIndex] = this.items[newHoleIdx]; // теперь на месте hole передвинутая ячейка

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

    let shiftTimeLimited = shiftTime;
    if (shiftTime < 1){
      shiftTimeLimited = 1;
    }
    if (shiftTime > 20){
      shiftTimeLimited = 20;
    }



    if (!this.isProcessRun) {
      this.isProcessRun = true;
      this.shiftCells(shiftTime*1000);
      this.processTimer = setInterval(this.shiftCells.bind(this, shiftTime*1000), shiftTime*1000);
 
    }
    else {

      clearInterval(this.processTimer);
      this.processTimer = 0;
      this.isProcessRun = false;
      //alert('Turned off');
    }

  }
}

class StrategyArbitrarily {
  constructor(){
    this.neighbours = [];
    this.previouslyShifted = -2;
  }
  shift(divider, prevHole) {
    if (((prevHole + divider - 1) % divider !== divider - 1) && (prevHole - 1 !== this.previouslyShifted)) { // отсеиваются все ячейки из самой левой колонки
      this.neighbours.push(prevHole - 1); // присоединяем соседа слева
    }
    if ((prevHole + 1) % divider !== 0 && (prevHole + 1 !== this.previouslyShifted)) { // отсеиваются все ячейки из самой правой колонки
      this.neighbours.push(prevHole + 1); // присоединяем соседа справа
    }
    if (prevHole - divider >=0 && (prevHole - divider !== this.previouslyShifted)) {
      this.neighbours.push(prevHole - divider); // присоединяем соседа сверху      
    }
    if (prevHole + divider < divider * divider && (prevHole + divider !== this.previouslyShifted)) {
      this.neighbours.push(prevHole + divider); // присоединяем соседа сверху      
    }
    const arbitraryNeighbour = this.neighbours[Math.floor(Math.random()*this.neighbours.length)];

    //alert(`выбран ${arbitraryNeighbour}, \n${this.neighbours}, prev=${this.previouslyShifted}`);

    this.neighbours = []; // обнуляем массив перед следующей итерацией
    this.previouslyShifted = prevHole;
    return arbitraryNeighbour // возвращаем произвольного соседа, с которым hole будет меняться местами 
  }

}
