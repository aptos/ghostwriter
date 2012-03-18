function(doc) {
  if (doc.collection == "expenses") {
    emit(doc.collection, doc);
  }
};
