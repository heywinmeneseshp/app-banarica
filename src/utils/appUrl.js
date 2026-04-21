const getAppBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_OWN_URL || "";
};

export { getAppBaseUrl };
