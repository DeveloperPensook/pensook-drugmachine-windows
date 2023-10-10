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

    await client.setID(slaveId);

    let result = { success: false };
    const timeout = 10000; // 10 seconds timeout
    const interval = 1000; // 1 second interval

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            const data = await client.readHoldingRegisters(getStatusAddress, length);
            console.log("Data received:", data.data[0]); // Debug statement
            if (data.data[0] === expectResult) {
                try {
                    await client.writeRegisters(getStatusAddress, [0]);
                    console.log("Write successful"); // Debug statement
                    result = { success: true };
                } catch (err) {
                    console.error("Write error:", err); // Debug statement
                }
                break;
            }
            break;
        } catch (modbusError) {
            console.error("Modbus Error:", modbusError); // Debug statement
        }

        // Sleep for 1 second before the next attempt
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    await client.close();
    return result;
}

module.exports = {
    drugMachineModbus
};
