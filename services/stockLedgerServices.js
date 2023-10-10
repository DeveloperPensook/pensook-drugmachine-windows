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
                    let returnData = await updateToZero(ip, modbusPort, slaveId, [getStatusAddress], [0])
                    return returnData
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

async function updateToZero(ip, modbusPort, slaveId, address, value) {
    try {
        const client = new ModbusRTU();
        await client.connectTCP(ip, { port: modbusPort });

        const resMessage = [];
        let isPassed = true;

        for (let i = 0; i < address.length; i++) {
            try {
                await client.writeRegisters(address[i], [value[i]]);
                resMessage.push(`Register ${address[i]} written successfully.`);
                return {success: true}
            } catch (err) {
                console.error(`Error writing register ${address[i]}:`, err);
                isPassed = false;
            }
        }

        await client.close();
        return {success: true}
    } catch (error) {
        return { success: false, error: error.message };
    }
}


module.exports = {
    drugMachineModbus
};