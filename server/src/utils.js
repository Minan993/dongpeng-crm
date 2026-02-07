export const genDemandNo = (id, date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `DP-${y}${m}${d}-${String(id).padStart(4, '0')}`;
};

export const maskPhone = (phone) => phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '';
