//#region Imports

import * as fs from "fs";
import { IConverterResourcesMethods } from "./converter.interface";
import { IDataLocalizedMessages } from "../model/database";

//#endregion

export class ResourcesConverter implements IConverterResourcesMethods {

  //#region Private Properties

  /**
   * In case of create a new file, this is the header used
   */
  private fileHeader: any = `<?xml version="1.0" encoding="utf-8"?>
    <root>
      <!--
        Microsoft ResX Schema

        Version 2.0

        The primary goals of this format is to allow a simple XML format
        that is mostly human readable. The generation and parsing of the
        various data types are done through the TypeConverter classes
        associated with the data types.

        Example:

        ... ado.net/XML headers & schema ...
        <resheader name="resmimetype">text/microsoft-resx</resheader>
        <resheader name="version">2.0</resheader>
        <resheader name="reader">System.Resources.ResXResourceReader, System.Windows.Forms, ...</resheader>
        <resheader name="writer">System.Resources.ResXResourceWriter, System.Windows.Forms, ...</resheader>
        <data name="Name1"><value>this is my long string</value><comment>this is a comment</comment></data>
        <data name="Color1" type="System.Drawing.Color, System.Drawing">Blue</data>
        <data name="Bitmap1" mimetype="application/x-microsoft.net.object.binary.base64">
            <value>[base64 mime encoded serialized .NET Framework object]</value>
        </data>
        <data name="Icon1" type="System.Drawing.Icon, System.Drawing" mimetype="application/x-microsoft.net.object.bytearray.base64">
            <value>[base64 mime encoded string representing a byte array form of the .NET Framework object]</value>
            <comment>This is a comment</comment>
        </data>

        There are any number of "resheader" rows that contain simple
        name/value pairs.

        Each data row contains a name, and value. The row also contains a
        type or mimetype. Type corresponds to a .NET class that support
        text/value conversion through the TypeConverter architecture.
        Classes that don't support this are serialized and stored with the
        mimetype set.

        The mimetype is used for serialized objects, and tells the
        ResXResourceReader how to depersist the object. This is currently not
        extensible. For a given mimetype the value must be set accordingly:

        Note - application/x-microsoft.net.object.binary.base64 is the format
        that the ResXResourceWriter will generate, however the reader can
        read any of the formats listed below.

        mimetype: application/x-microsoft.net.object.binary.base64
        value   : The object must be serialized with
                : System.Runtime.Serialization.Formatters.Binary.BinaryFormatter
                : and then encoded with base64 encoding.

        mimetype: application/x-microsoft.net.object.soap.base64
        value   : The object must be serialized with
                : System.Runtime.Serialization.Formatters.Soap.SoapFormatter
                : and then encoded with base64 encoding.

        mimetype: application/x-microsoft.net.object.bytearray.base64
        value   : The object must be serialized into a byte array
                : using a System.ComponentModel.TypeConverter
                : and then encoded with base64 encoding.
        -->
      <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
        <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />
        <xsd:element name="root" msdata:IsDataSet="true">
          <xsd:complexType>
            <xsd:choice maxOccurs="unbounded">
              <xsd:element name="metadata">
                <xsd:complexType>
                  <xsd:sequence>
                    <xsd:element name="value" type="xsd:string" minOccurs="0" />
                  </xsd:sequence>
                  <xsd:attribute name="name" use="required" type="xsd:string" />
                  <xsd:attribute name="type" type="xsd:string" />
                  <xsd:attribute name="mimetype" type="xsd:string" />
                  <xsd:attribute ref="xml:space" />
                </xsd:complexType>
              </xsd:element>
              <xsd:element name="assembly">
                <xsd:complexType>
                  <xsd:attribute name="alias" type="xsd:string" />
                  <xsd:attribute name="name" type="xsd:string" />
                </xsd:complexType>
              </xsd:element>
              <xsd:element name="data">
                <xsd:complexType>
                  <xsd:sequence>
                    <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                    <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />
                  </xsd:sequence>
                  <xsd:attribute name="name" type="xsd:string" use="required" msdata:Ordinal="1" />
                  <xsd:attribute name="type" type="xsd:string" msdata:Ordinal="3" />
                  <xsd:attribute name="mimetype" type="xsd:string" msdata:Ordinal="4" />
                  <xsd:attribute ref="xml:space" />
                </xsd:complexType>
              </xsd:element>
              <xsd:element name="resheader">
                <xsd:complexType>
                  <xsd:sequence>
                    <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                  </xsd:sequence>
                  <xsd:attribute name="name" type="xsd:string" use="required" />
                </xsd:complexType>
              </xsd:element>
            </xsd:choice>
          </xsd:complexType>
        </xsd:element>
      </xsd:schema>
      <resheader name="resmimetype">
        <value>text/microsoft-resx</value>
      </resheader>
      <resheader name="version">
        <value>2.0</value>
      </resheader>
      <resheader name="reader">
        <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
      </resheader>
      <resheader name="writer">
        <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
      </resheader>
    </root>`;

  //#endregion

  //#region Private Methods

  /**
   * Add new localized message to culture file
   * @param cultureFile (file of localized message culture)
   * @param localizedMessage (localized message)
   */
  private addNewLocalizedMessage(cultureFile: string, localizedMessage: IDataLocalizedMessages) {
    // Read content of file
    let cultureFileContent = fs.readFileSync(cultureFile).toString();
    // If content of file doesn't include the localized message, the localized message is added in the end of file
    if (cultureFileContent.match(`<data name="${localizedMessage.localizedMessageName}"`) === null) {
      let stringToReplace: string = "</root>";
      let newLocalizedMessage = `  <data name="${localizedMessage.localizedMessageName}" xml:space="preserve">\r\n` +
        `    <value>${localizedMessage.localizedMessageText}</value>\r\n` +
        `  </data>\r\n` +
        `</root>`;
      let textToFile: string = cultureFileContent.replace(stringToReplace, newLocalizedMessage);
      fs.writeFileSync(cultureFile, Buffer.from(textToFile), { flag: "w" });
      return cultureFile;
    }
    else {
      return null;
    }
  }

  //#endregion

  //#region Public Methods

  /**
   * Receiving a localized message, this method will find the file that will change and
   * insert the new localized message.
   * Return array with changed paths
   * @param localized (localized messages)
   * @param contentForEachFile (map with content for each file where keys are the paths and values the respective content)
   * @param filesResourcesExtension (extension of files)
   */
  public async writeToFile(localized: IDataLocalizedMessages[], contentForEachFile: Map<string, string>, filesResourcesExtension: string) {
    try {
      // Get keys in map "contentForEachFile"
      let keysMapContentForEachFile = Array.from(contentForEachFile.keys());

      // Array with files changed
      const filesChanged: string[] = [];

      // For each localized message in localized and each key in keysMapContentForEachFile
      for (let message in localized) {
        for (let file in keysMapContentForEachFile) {
          // Get content of file in position "file"
          let fileContent = contentForEachFile.get(keysMapContentForEachFile[file]);
          // Check if file already contains the localized message in "localized" for position "message"
          if (fileContent.match(`<data name="${localized[message].localizedMessageName}"`)) {
            /**
             * Check if culture name of localized message is different of "en-US" because name of files in English
             * are nominated as, for example, "xpto.resx" and in other languages are "xpto.pt-PT.resx".
             * Additionally, if `fileContent.match(<data name="${localized[message].localizedMessageName}`, we already
             * know that localized message exists in needed file
             */
            if (localized[message].cultureName !== "en-US") {
              // Get filename for culture name of localized message
              let cultureFile = keysMapContentForEachFile[file].replace(filesResourcesExtension,
                `.${localized[message].cultureName}${filesResourcesExtension}`);
              // Check if file exists
              if (fs.existsSync(cultureFile)) {
                // Check if the localized message doesn't exist and add new localized message to file
                let cultureFileName = this.addNewLocalizedMessage(cultureFile, localized[message]);
                // Push the name of file changed
                if (cultureFileName !== null && !filesChanged.includes(cultureFileName)) {
                  filesChanged.push(cultureFileName);
                }
              } else {
                // Create file
                fs.writeFile(cultureFile, this.fileHeader, function (err) {
                  if (err) {
                    return console.error(err);
                  }
                  console.log(`File ${cultureFile} created!`);
                });
                // Check if the localized message doesn't exist and add new localized message to file
                let cultureFileName = this.addNewLocalizedMessage(cultureFile, localized[message]);
                // Push the name of file changed
                if (cultureFileName !== null && !filesChanged.includes(cultureFileName)) {
                  filesChanged.push(cultureFileName);
                }
              }
            }
          } else {
            console.log(`Localized Message: ${localized[message].localizedMessageName} resource file was not found.`);
          }
        }
      }
      return filesChanged;
    }
    catch (err) {
      console.log(err);
      return undefined;
    }
  }

  //#endregion
}