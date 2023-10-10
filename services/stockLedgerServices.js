const ModbusRTU = require("modbus-serial");

async function drugMachineModbus(req) {
    const { ip, port: modbusPort, slaveId, address, value, entryType, entryStatusAddress, doorStatusAddress } = req.body;
    const client = new ModbusRTU();
    await client.connectTCP(ip, { port: modbusPort });
    for (let i = 0; i < address.length; i++) {
        try {
            await client.writeRegisters(address[i], [value[i]]);
        } catch (err) {
            return { success: false };
        }
    }
    const length = 1;
    const getStatusAddress = entryType === 'Pickup Medicine' ? entryStatusAddress : doorStatusAddress;
    const expectResult = entryType === 'Pickup Medicine' ? 1 : 0;

    const client2 = new ModbusRTU();
    await client2.connectTCP(ip, { port: modbusPort });
    await client2.setID(slaveId);

    let result;

    async function readHoldingRegistersWithTimeout() {
        try {
            const startTime = Date.now();
            while (true) {
                const data = await client2.readHoldingRegisters(getStatusAddress, length);
                if (data.data[0] === expectResult) {
                    const client3 = new ModbusRTU();
                    await client3.connectTCP(ip, { port: modbusPort });
                    try {
                        await client3.writeRegisters(getStatusAddress, [0]);
                        return { success: true };
                    } catch (err) {
                        return { success: false };
                    }
                } else {
                    // Check for timeout and exit the loop if necessary
                    if (Date.now() - startTime >= 60000) {
                        return { success: false };
                    }
                    // Sleep for 1 second before the next attempt
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            throw error;
        }
    }

    return await readHoldingRegistersWithTimeout();
}

module.exports = {
    drugMachineModbus
};
