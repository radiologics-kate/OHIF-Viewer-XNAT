export default function onImportButtonClick() {
  const { ImportCallbackOrComponent } = this.props;

  if (ImportCallbackOrComponent.prototype.isReactComponent) {
    this.setState({ importing: true });
  } else {
    ImportCallbackOrComponent();
  }
}
