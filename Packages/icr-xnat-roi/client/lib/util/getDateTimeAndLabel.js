/**
 * getDateTimeAndLabel - Calulates the current date and time and generates a
 *                       label.
 *
 * @param  {string} roiCollectionType The type of ROICollection.
 * @returns {object}  An object with the dateTime property containing the
 *                    timestamp, and a label property for the collection.
 */
export default function getDateTimeAndLabel(roiCollectionType) {
  const d = new Date();
  const dateTime = {
    year: d.getFullYear().toString(),
    month: (d.getMonth() + 1).toString(),
    date: d.getDate().toString(),
    hours: d.getHours().toString(),
    minutes: d.getMinutes().toString(),
    seconds: d.getSeconds().toString()
  };

  // Pad with zeros e.g. March: 3 => 03
  Object.keys(dateTime).forEach(element => {
    if (dateTime[`${element}`].length < 2) {
      dateTime[`${element}`] = "0" + dateTime[`${element}`];
    }
  });

  const dateTimeFormated =
    dateTime.year +
    dateTime.month +
    dateTime.date +
    dateTime.hours +
    dateTime.minutes +
    dateTime.seconds;

  return {
    dateTime: dateTimeFormated,
    label: `${roiCollectionType}_${dateTimeFormated.slice(
      0,
      8
    )}_${dateTimeFormated.slice(8, 14)}`
  };
}
