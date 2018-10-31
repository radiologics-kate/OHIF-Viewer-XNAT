const Mousetrap = require('mousetrap');

console.log(Mousetrap);

Mousetrap.bind(['up', 'down'], function(evt) {
  const keys = {
    UP: 38,
    DOWN: 40
  };

  console.log('MOUSETRAP TRIGGERED');

});
