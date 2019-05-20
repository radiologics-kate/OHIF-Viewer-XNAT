export default function getExpandIcon() {
  if (this.state.expanded) {
    return "fa fa-minus-circle";
  }

  return "fa fa-plus-circle";
}
