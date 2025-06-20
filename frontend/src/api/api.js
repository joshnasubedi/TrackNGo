import axios from "axios";

const params = {};

export const fetchDataFromApi = async (url) => {
  try {
    const { data } = await axios.get(
      process.env.REACT_APP_DEV_URL + url,
      params
    );
    return data;
  } catch (err) {
    console.log(err);
    return err;
  }
};

export const postDataToApi = async (url, formData) => {
  try {
    const { data } = await axios.post(
      process.env.REACT_APP_DEV_URL + url,
      formData
    );
    console.log(data); // This will execute before returning the data
    return data;
  } catch (err) {
    console.error("Error posting data to API:", err);
    throw err; // Rethrow the error for better error handling
  }
};
const params_delete = {
  method: "DELETE",
  headers: {
    Authorization: "Bearer " + process.env.REACT_APP_STRIPE_APP_KEY,
  },
};

export const removeDataFromApi = async (url) => {
  try {
    const data = await axios.delete(
      process.env.REACT_APP_DEV_URL + url,
      params_delete
    );
    return data.data; // return just the response data
  } catch (err) {
    console.error("Error deleting data:", err);
    throw new Error(err.response ? err.response.data : "An error occurred");
  }
};

const params_update = {
  method: "PUT",
  headers: {
    Authorization: "Bearer " + process.env.REACT_APP_STRIPE_APP_KEY,
  },
};

export const update_data_to_api = async (url, formData) => {
  const data = await axios.put(process.env.REACT_APP_DEV_URL + url, {
    data: formData,
  });
  console.log(data); // This will execute before returning the data
  return data;
};
