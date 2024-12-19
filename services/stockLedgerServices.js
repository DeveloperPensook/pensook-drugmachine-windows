const ModbusRTU = require("modbus-serial");
const axios = require('axios');

async function insertIdCard(req) {
    try {
        const { idCardNumber } = req.body;

        // Send HTTP request
        const response = await axios.post(
          "http://203.150.243.84:4000/api/drugMachine/initDrugMachineEntry",
          {
            idCardNumber: idCardNumber,
          }
        );

        return true

        // open when test id card reader 
        // if (response.status === true) {
        //   const drugmachineEntryList = response.result.drugmachineEntryList;
        //   const drugmachine = response.result.drugmachine;

        //   const { ip, port: modbusPort, slaveId, address, value, entryType, entryStatusAddress, doorStatusAddress } = req.body;
        //   const client = new ModbusRTU();
        //   await client.connectTCP(drugmachine.ip, drugmachine.port);
        //   for (const row of drugmachineEntryList) {
        //     try {
        //         await client.writeRegisters(row.address, row.qty);
        //       } catch (err) {
        //         return { status: err };
        //       }
        //   }

        //   const length = 1;
        //   if (drugmachineEntryList[0].entryType != "Pickup Medicine") {
        //     const timeout = 80000;
        //     const interval = 1000; // 1 second interval

        //     const startTime = Date.now();
        //     let conditionMet = false; // Flag to track whether the condition has been met

        //     while (!conditionMet && Date.now() - startTime < timeout) {
        //       try {
        //         let data = await client.readHoldingRegisters(
        //           [drugmachineEntryList[0].address],
        //           length
        //         );
        //         console.log("Data received:", data.data[0]); // Debug statement
        //         if (data.data[0] === 0) {
        //           conditionMet = true; // Set the flag to true when the condition is met
        //         }
        //       } catch (modbusError) {
        //         console.error("Modbus Error:", modbusError); // Debug statement
        //       }
        //       // Sleep for 1 second before the next attempt
        //       await new Promise((resolve) => setTimeout(resolve, interval));
        //     }
        //   }

        //   const getStatusAddress =
        //     drugmachineEntryList[0].entryType === "Pickup Medicine"
        //       ? drugmachine.entryStatusAddress
        //       : drugmachine.doorStatusAddress;
        //   const expectResult = drugmachineEntryList[0].entryType === "Pickup Medicine" ? 1 : 0;

        //   await client.setID(slaveId);

        //   let result = { status: false };
        //   const timeout = drugmachineEntryList[0].entryType === "Pickup Medicine" ? 180000 : 1200000;
        //   const interval = 1000; // 1 second interval

        //   const startTime = Date.now();
        //   let conditionMet = false; // Flag to track whether the condition has been met

        //   while (!conditionMet && Date.now() - startTime < timeout) {
        //     try {
        //       let data = await client.readHoldingRegisters(
        //         getStatusAddress,
        //         length
        //       );
        //       console.log("Data received:", data.data[0]); // Debug statement
        //       if (data.data[0] === expectResult) {
        //         try {
        //           await client.writeRegisters(getStatusAddress, [0]);
        //           console.log("Write successful"); // Debug statement
        //           result = { status: true };
        //         } catch (err) {
        //           console.error("Write error:", err); // Debug statement
        //         }
        //         conditionMet = true; // Set the flag to true when the condition is met
        //       }
        //     } catch (modbusError) {
        //       console.error("Modbus Error:", modbusError); // Debug statement
        //     }

        //     // Sleep for 1 second before the next attempt
        //     await new Promise((resolve) => setTimeout(resolve, interval));
        //   }
        //   await client.close();
        //   if (!conditionMet) {
        //     console.error("Timeout reached");
        //     result = { status: false };
        //   }
        //   return result;
        // }
    } catch (error) {
        console.error("Error in drugMachineModbus:", error.message);
        return { error: error.message };
    }
}

async function removeIdCard(req) {
    try {
        const { idCardNumber } = req.body;

        // Send HTTP request
        const response = await axios.post(
          "http://203.150.243.84:4000/api/drugMachine/endDrugMachineEntry",
          {
            idCardNumber: idCardNumber,
          }
        );

        return { status: response.status }
    } catch (error) {
        console.error("Error in drugMachineModbus:", error.message);
        return { error: error.message };
    }
}

module.exports = {
    insertIdCard,
    removeIdCard
};