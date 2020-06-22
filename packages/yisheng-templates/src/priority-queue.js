export const PriorityQueue = function (compare_fn) {
  var data = [];
  var map = {};

  var swap = function (a, b) {
    const tmp = data[a];
    data[a] = data[b];
    data[b] = tmp;
  };

  var compare =
    compare_fn ||
    function (a, b) {
      return data[a] > data[b];
    };

  var shift_up = function (i) {
    var parent = (i - 1) / 2;

    if (parent >= 0 && compare(i, parent)) {
      swap(i, parent);
      shift_up(parent);
    }
  };
  var max_heapify = function (i) {
    var left = 2 * i + 1,
      right = 2 * i + 2;

    var largest =
      (compare(i, right) && right) || (compare(i, left) && left) || i;
    if (largest != i) {
      swap(i, largest);
      max_heapify(largest);
    }
  };
  var _push = function (d) {
    data.push(d);
    shift_up(data.length - 1);
    map[_hashCode(d)] = 1;
  };
  var _hashCode = function (d) {
    return JSON.stringify(d);
  };
  var _pop = function () {
    if (data.length == 0) return null;
    var max = data[0];
    swap(0, data.length - 1);
    delete map[max];
    data.pop();
    max_heapify(0);
    return max;
  };
  var _contains = function (d) {
    return typeof map[_hashCode(d)] !== "undefined";
  };
  var _isEmpty = function () {
    return data.length == 0;
  };

  return {
    data: data,
    push: _push,
    contains: _contains,
    isEmpty: _isEmpty,
    pop: _pop,
  };
};
