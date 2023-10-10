const express = require("express");
const ModbusRTU = require("modbus-serial");

async function drugMachineModbus(req) {
    const { ip, port: modbusPort, slaveId, address, value, entryType, entryStatusAddress, doorStatusAddress } = req.body;

    try {
        const client = new ModbusRTU();
        await client.connectTCP(ip, { port: modbusPort });

        const resMessage = [];
        let isPassed = true;

        for (let i = 0; i < address.length; i++) {
            try {
                await client.writeRegisters(address[i], [value[i]]);
                resMessage.push(`Register ${address[i]} written successfully.`);
            } catch (err) {
                console.error(`Error writing register ${address[i]}:`, err);
                isPassed = false;
            }
        }

        await client.close();

        // after writeRegisters read status of register
        const length = 1; // Assuming you want to read one holding register
        const getStatusAddress = entryType === 'Pickup Medicine' ? entryStatusAddress : doorStatusAddress;
        const expectResult = entryType === 'Pickup Medicine' ? 1 : 0;

        const client2 = new ModbusRTU();
        await client2.connectTCP(ip, { port: modbusPort });
        await client2.setID(slaveId);

        let result;

        // Define a function to read holding registers with a timeout
        async function readHoldingRegistersWithTimeout() {
            try {
                const data = await client2.readHoldingRegisters(getStatusAddress, length);
                if (data.data[0]) {
                    result = data.data[0];
                }
                if (result === expectResult) {
                    return { success: true };
                } else {
                    // If result is not as expected, force a repeated read every 1 second for up to 10 seconds
                    if (Date.now() - startTime < 60000) {
                        setTimeout(readHoldingRegistersWithTimeout, 1000);
                    } else {
                        throw new Error("Timeout");
                    }
                }
            } catch (error) {
                throw error;
            }
        }

        const startTime = Date.now();
        return (await readHoldingRegistersWithTimeout());
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getStatusModbus(req) {
    const { ip, modbusPort, slaveId, address, length, entryType, entryStatusAddress, doorStatusAddress } = req.body;

    try {
        const client = new ModbusRTU();
        let startTime = Date.now(); // Record the start time

        await client.connectTCP(ip, { port: modbusPort });
        await client.setID(slaveId);

        let data;
        let readComplete = false;

        // Set a 5-minute (300000 milliseconds) timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Timeout exceeded"));
            }, 10000);
        });

        // Log elapsed time every second
        const interval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            console.log(`Elapsed time: ${elapsedTime} seconds`);
        }, 1000);

        while (!readComplete) {
            data = await Promise.race([
                client.readHoldingRegisters(address, length),
                timeoutPromise // Race with the timeout promise
            ]);

            if (data instanceof Error) {
                throw data; // Propagate the error if it's an error
            }

            console.log("Holding registers:", data.data);

            if (entryType == 'Pickup Medicine') {
                if (data.data[0] === 1) {
                    drugMachineModbus(ip, modbusPort, slaveId, [entryStatusAddress], [0]);
                    readComplete = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                if (data.data[0] === 0) {
                    readComplete = true;
                }
            }
        }

        clearInterval(interval); // Stop logging elapsed time
        await client.close();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    drugMachineModbus,
    getStatusModbus
};