import React from "react";
import LockedCollectionsListItem from "./LockedCollectionsListItem.js";

export default class LockedCollectionsList extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { lockedCollections, onUnlockClick, seriesInstanceUid } = this.props;

    return (
      <>
        {lockedCollections.map(collection => (
          <LockedCollectionsListItem
            key={collection.metadata.uid}
            collection={collection}
            onUnlockClick={onUnlockClick}
            seriesInstanceUid={seriesInstanceUid}
          />
        ))}
      </>
    );
  }
}
