import { ref, set } from "firebase/database";
import { database } from "../firebaseConfig";

export const updateControl = (greenhouseId, newControl) => {
  const controlRef = ref(database, `greenhouse/${greenhouseId}/control`);
  return set(controlRef, newControl);
};
