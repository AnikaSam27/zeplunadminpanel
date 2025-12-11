import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function AutoLogout() {
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);

      // 3 hours = 10800000 ms
      timer = setTimeout(() => {
        signOut(auth);
        alert("You have been logged out due to 3 hours of inactivity.");
        window.location.href = "/"; // send to login
      }, 3 * 60 * 60 * 1000);
    };

    // Activity listeners
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    resetTimer(); // start countdown

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, []);

  return null;
}
