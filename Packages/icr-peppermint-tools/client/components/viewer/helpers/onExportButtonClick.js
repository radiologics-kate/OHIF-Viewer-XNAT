export default function onExportButtonClick() {
  const { ExportCallbackOrComponent } = this.props;

  if (ExportCallbackOrComponent.prototype.isReactComponent) {
    this.setState({ exporting: true });
  } else {
    ExportCallbackOrComponent();
  }
}
