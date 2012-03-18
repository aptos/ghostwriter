function(doc) {
  if (doc.collection == "timecards") {
    emit(doc.collection, doc);
  }
};
