import SerialPort from "serialport";
import Readline from "@serialport/parser-readline";

const port = new SerialPort("/dev/tty-usbserial1", { baudRate: 9600 });

const parser = port.pipe(new Readline({ delemiter: "\r\n" }));

parser.on("data", (data) => {
  console.log("data", data);
});

port.on("error", (err) => {
  console.error("Error: ", err.message);
});
