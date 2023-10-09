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
  
        return { success: true, data: resMessage }
    } catch (error) {
        return error
    }
}

async function getStatusModbus(req) {
    const { ip, modbusPort, slaveId, address, length } = req.body;

  try {
    const client = new ModbusRTU();
    
    await client.connectTCP(ip, { port: modbusPort });
    await client.setID(slaveId);

    const data = await client.readHoldingRegisters(address, length);
    
    await client.close();

    console.log("Holding registers:", data.data);
    if (entryType == 'Pickup Medicine') {
        if (data.data[0] == 1) {
            await drugMachineModbus({body: {
                ip: ip,
                modbusPort: modbusPort,
                slaveId: slaveId,
                address: [address],
                value: [0]
            }})
        }
    } else {
        if (data.data[0] == 0) {
            await drugMachineModbus({body: {
                ip: ip,
                modbusPort: modbusPort,
                slaveId: slaveId,
                address: [address],
                value: [0]
            }})
            return { sucess: true, result: {
                stockLedgerEntryId: stockLedgerEntryId,
                drugMachineOpenHistoryId: drugMachineOpenHistoryId,
            }}
        }
    }
    res.json({ success: true, data: data.data[0] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
    drugMachineModbus,
    getStatusModbus
};