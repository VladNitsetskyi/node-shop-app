const deleteProduct = (id, token) => {
  fetch("/admin/product/" + id, {
    method: "DELETE",
    headers: {
      "csrf-token": token
    }
  }).then(result => {
    document.getElementById(id).remove();
    location.reload(false);
  });
};
