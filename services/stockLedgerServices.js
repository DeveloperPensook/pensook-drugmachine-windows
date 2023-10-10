async function drugMachineModbus(req) {
    const { ip, port: modbusPort, slaveId, address, value, entryType, entryStatusAddress, doorStatusAddress } = req.body;
    const client = new ModbusRTU();

    try {
        await client.connectTCP(ip, { port: modbusPort });

        for (let i = 0; i < address.length; i++) {
            try {
                await client.writeRegisters(address[i], [value[i]]);
            } catch (err) {
                console.error(`Error writing register ${address[i]}:`, err);
            }
        }
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await client.close();
        const length = 1;
        const getStatusAddress = entryType === 'Pickup Medicine' ? entryStatusAddress : doorStatusAddress;
        const expectResult = entryType === 'Pickup Medicine' ? 1 : 0;

        const client2 = new ModbusRTU();
        await client2.connectTCP(ip, { port: modbusPort });
        await client2.setID(slaveId);

        let result;

        async function readHoldingRegistersWithTimeout() {
            try {
                const data = await client2.readHoldingRegisters(getStatusAddress, length);
                if (data.data[0]) {
                    result = data.data[0];
                }
                if (result === expectResult) {
                    let returnData = await updateToZero(ip, modbusPort, getStatusAddress, 0);
                    return returnData;
                } else {
                    if (Date.now() - startTime < 60000) {
                        setTimeout(readHoldingRegistersWithTimeout, 1000);
                    } else {
                        throw new Error("Timeout");
                    }
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        const startTime = Date.now();
        return (await readHoldingRegistersWithTimeout());
    } 
}

async function updateToZero(ip, modbusPort, address, value) {
    const client = new ModbusRTU();
    try {
        await client.connectTCP(ip, { port: modbusPort });
        await client.writeRegisters(address, [value]);
        await client.close();
        return {success: true}
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        return {success: true}
    }
}

module.exports = {
    drugMachineModbus
};