import getDateTimeAndLabel from './getDateTimeAndLabel.js';

export default function () {
  const dateTime = getDateTimeAndLabel().dateTime;

  return {
    date: `${dateTime.slice(0,4)}-${dateTime.slice(4,6)}-${dateTime.slice(6,8)}`,
    time: `${dateTime.slice(8,10)}:${dateTime.slice(10,12)}:${dateTime.slice(12,14)}`
  };
}
