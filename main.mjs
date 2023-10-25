import xlsx from 'xlsx'
import { json2xml } from 'xml-js';
import util from 'util'
import fs from 'fs'

const resultFileName = 'result.xml'
const deliveriesPath = "./files/deliveries.xlsx"
const deliveriesSheetName = 'Produkty'
const productsPath = "./files/products.xlsx"
const productsSheetName = 'List1'


const constPath = "./files/const.xlsx"
const constSheetName = 'List1'

let deliveriesData = {}
let productsData = {}
let constData = {}

let resultData = []
let uniqueResultData = []


const formatingToXml = (data) => {


    data.forEach(function (dataRow, index) {
        // data[index]['ZBOZI'] = data['producsFounds']
        // delete data[index]['producsFounds']
        // const obj = { oldKey: 'producsFounds' };

        delete Object.assign(data[index], { 'ZBOZI': data[index]['producsFounds'] })['producsFounds'];
    })
    // const renamedData = data.map(({ producsFounds }) => ({ label: id, value: name }));

    // console.log(data)
    return { 'OBJEDNAVKA': { 'PREPRAVA_FOFR': data } }
}


const xlsxToJson = (filePath, sheetName) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
};

const main = async () => {

    deliveriesData = xlsxToJson(deliveriesPath, deliveriesSheetName);
    productsData = xlsxToJson(productsPath, productsSheetName);
    constData = xlsxToJson(constPath, constSheetName);

    // console.log(deliveriesData)
    // console.log(productsData)
    // console.log("Founding.....")

    deliveriesData.forEach(deliveryRow => {

        let producsFounds = productsData.filter(productsRow => productsRow['ZBOZI_2'] === deliveryRow['merge'])
        ///Upravujes produkty kazdy zvlast lebo uz ich mas najdene
        producsFounds.forEach(function (producsFoundsRow, index) {
            // console.log(producsFoundsRow)
            // console.log(deliveryRow['ZBOZI_KUSY'])
            producsFounds[index] = { ...producsFoundsRow, 'ZBOZI_KUSY': deliveryRow['ZBOZI_KUSY'] }
            delete producsFounds[index]['ZBOZI_2']

            producsFounds[index]['ZBOZI_NAZEV'] = `${producsFoundsRow['ZBOZI_NAZEV']}-${deliveryRow['LAST4']}`
        })

        // console.log(producsFounds)
        resultData = [...resultData, { deliveryRow, producsFounds }]
        // console.log(resultData)
    });
    // console.log(resultData)

    // uniqueResultData = [...new Set(deliveriesData.map(item => item['geisOrderCode']))];
    // console.log(".........") dsaffdsaf
    // console.log("Unique.....")

    uniqueResultData = [...new Map(deliveriesData.map(item =>
        [item['CODE'], item])).values()];
    // console.log(uniqueResultData)
    // console.log(".........")

    // console.log("Unique adding producest.....")

    resultData.forEach(reusltRow => {

        uniqueResultData.forEach(function (uniqueReusltRow, index) {
            // console.log('..................')
            // console.log(reusltRow)
            // console.log(reusltRow['deliveryRow']['CODE'])
            // console.log(resultData['producsFounds'])
            // console.log(uniqueReusltRow)
            // console.log(uniqueReusltRow['CODE'])
            // console.log('..................')
            // console.log(index)

            uniqueResultData[index] = { ...uniqueReusltRow, ...constData[0] }
            uniqueResultData[index] = Object.assign(uniqueReusltRow, constData[0]);
            // console.log(uniqueResultData)

            delete uniqueResultData[index]['ZBOZI_KUSY']
            delete uniqueResultData[index]['orderItemName']
            delete uniqueResultData[index]['LAST4']
            delete uniqueResultData[index]['orderItemVariantName']
            delete uniqueResultData[index]['merge']
            delete uniqueResultData[index]['labels']
            // console.log(uniqueReusltRow)


            if (!uniqueResultData[index]['producsFounds'])
                uniqueResultData[index]['producsFounds'] = []
            if (reusltRow['deliveryRow']['CODE'] === uniqueReusltRow['CODE']) {
                uniqueResultData[index]['producsFounds'] = uniqueReusltRow['producsFounds'].concat(reusltRow['producsFounds'])
                // uniqueReusltRow['producsFounds'] = uniqueReusltRow['producsFounds'].concat(reusltRow['producsFounds'])
            }
            // console.log(uniqueResultData)
            // delete resultData[index]['producsFounds']['ZBOZI_2']
        })

        // console.log(constData)

    });
    // console.log(".........")
    // console.log("Formating data.....")

    console.log(util.inspect(uniqueResultData, false, null, true /* enable colors */))

    let finaleData = formatingToXml(uniqueResultData)
    // console.log(util.inspect(finaleData, false, null, true /* enable colors */))
    // console.log(JSON.stringify(finaleData))
    // console.log(".........")

    const xml = json2xml(JSON.stringify(finaleData), { compact: true, spaces: 4 });

    // console.log(xml);
    fs.writeFileSync(resultFileName, xml);

    // console.log(resultData)
}

main()