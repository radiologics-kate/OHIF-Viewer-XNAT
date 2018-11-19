export default function () {
  const d = new Date();
  const dateTime = {
    year: d.getFullYear().toString(),
    month: ( d.getMonth() + 1 ).toString(),
    date: d.getDate().toString(),
    hours: d.getHours().toString(),
    minutes: d.getMinutes().toString(),
    seconds: d.getSeconds().toString()
  };

  // Pad with zeros e.g. March: 3 => 03
  Object.keys(dateTime).forEach(element => {
    if (dateTime[`${element}`].length < 2) {
      dateTime[`${element}`] = '0' + dateTime[`${element}`];
    };
  });

  const dateTimeFormated = dateTime.year + dateTime.month + dateTime.date
    + dateTime.hours + dateTime.minutes + dateTime.seconds;

  return {
    dateTime: dateTimeFormated,
    label: `AIM_${dateTimeFormated.slice(0,8)}_${dateTimeFormated.slice(8,14)}`
  };
}
