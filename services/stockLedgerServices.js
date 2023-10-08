const pool = require("../db");
const express = require("express");
const ModbusRTU = require("modbus-serial");
const app = express();
const port = 3012;

async function drugMachineModbus(req) {
    try {
        const { ip, port: modbusPort, slaveId, address, value, drugMachineCode, stockLedgerEntryId, drugMachineOpenHistoryId, entryStatusAddress } = req.body;
        let resMessage = [];
        let registers = [];

        for (let i = 0; i < address.length; i++) {
            registers.push({
                address: address[i],
                value: value[i],
            });
        }

        function writeRegistersSequentially(ip, modbusPort, slaveId, registers) {
            return new Promise((resolve, reject) => {
                const client = new ModbusRTU();
                client.connectTCP(ip, { port: modbusPort });

                function writeNextRegister() {
                    if (registers.length === 0) {
                        resolve();
                        return;
                    }

                    const register = registers.shift();
                    client.setID(slaveId);
                    try {
                        client.writeRegisters(register.address, [register.value]);
                        resMessage.push(
                            `Register ${register.address} written successfully.`
                        );
                    } catch (err) {
                        console.error(`Error writing register ${register.address}:`, err);
                    }

                    writeNextRegister();
                }

                writeNextRegister();

                client.on("close", () => {
                    resolve();
                });

                client.on("error", (err) => {
                    reject(err);
                });
            });
        }

        await writeRegistersSequentially(ip, modbusPort, slaveId, registers);

        const client = new ModbusRTU();
        const readAndCheckRegisters = () => {
            client.readHoldingRegisters(slaveId, entryStatusAddress, length, (err, data) => {
                if (err) {
                    console.error("Error reading holding registers:", err);
                } else {
                    console.log("Holding registers:", data.data);
                    if (data.data === "2" || data.data === "3") {
                        client.close(() => {
                            let message;
                            if (stockLedgerEntryId) {
                                message = {
                                    stockLedgerEntryId: stockLedgerEntryId
                                }
                            } else {
                                message = {
                                    drugMachineOpenHistoryId: drugMachineOpenHistoryId
                                }
                            }

                            const io = req.app.get("socketio");
                            const eventData = {
                                page: 'success',
                                drugMachineCode: drugMachineCode,
                                message: message
                            };
                            io.emit("message", JSON.stringify(eventData));
                            res.json({ success: true, data: data });
                            console.log("Connection closed");
                        });
                    } else {
                        setTimeout(readAndCheckRegisters, 1000);
                    }
                }
            });
        };
        client.connectTCP(ip, { port: port })
            .then(() => {
                console.log("Connected successfully");
                // Start the reading and checking process
                readAndCheckRegisters();
            })
            .catch((connectErr) => {
                console.error("Error connecting to Modbus device:", connectErr);
            });



        res.json({ success: true, data: resMessage });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    drugMachineModbus
};
