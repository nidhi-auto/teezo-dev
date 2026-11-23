export function sendSuccess(res, data, status = 200) {
  if (status === 204) {
    return res.status(204).send();
  }
  return res.status(status).json(data);
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}