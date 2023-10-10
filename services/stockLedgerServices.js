const express = require("express");
const ModbusRTU = require("modbus-serial");

async function drugMachineModbus(req) {
    const { ip, port: modbusPort, slaveId, address, value } = req.body;
  
    try {
        const client = new ModbusRTU();
        await client.connectTCP(ip, { port: modbusPort });
      
        const resMessage = [];
  
        for (let i = 0; i < address.length; i++) {
        try {
            await client.writeRegisters(address[i], [value[i]]);
            resMessage.push(`Register ${address[i]} written successfully.`);
            } catch (err) {
                console.error(`Error writing register ${address[i]}:`, err);
            }
        }
  
        await client.close();
  
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

async function getStatusModbus(req) {
    const { ip, modbusPort, slaveId, address, length, entryType, entryStatusAddress } = req.body;

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