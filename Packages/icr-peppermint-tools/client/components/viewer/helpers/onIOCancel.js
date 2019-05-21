export default function onIOCancel() {
  this.setState({
    importing: false,
    exporting: false
  });
}
