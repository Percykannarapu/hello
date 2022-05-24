import { LogLevels } from '@val/common';
import { LayerKeys } from '@val/esri';
import { serverEnv } from './server-urls';

export const environment = {
  production: false,
  serverBuild: false,
  logLevel: LogLevels.DEBUG,
  sanitizeActions: false,
  sanitizeState: false,
};

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'DEV';

  public static fuseBaseUrl = serverEnv.middlewareBase;
  public static impowerBaseUrl = 'http://localhost:4200/';
  public static printServiceUrl = 'https://impowerpdf.valassisdigital.io';

  public static esri = {
    portalServer:  'https://impower.valassis.com/',
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerKeyFixup: Map<string, LayerKeys> = new Map<string, LayerKeys>([
    ['99fd67933e754a1181cc755146be21ca', LayerKeys.State],
    ['7fa18dcf1b934ff3bd6137b209d1faf0', LayerKeys.DMA],
    ['3c9cc326b95e4521bed397b5c2dfdc33', LayerKeys.DMA],
    ['c6f80ec54ea84d0185cdc73c64c023b5', LayerKeys.Counties],
    ['78dfd4524abd4665840ec898c03bc88e', LayerKeys.Counties],
    ['1f68c98ed4d44156a65f1a61e80fbf5a', LayerKeys.Counties],
    ['afa4c711129a4538a9d5c5adc40ac69c', LayerKeys.Zip],
    ['da6a828d6bef47958e80e23522ff3727', LayerKeys.Zip],
    ['89cac0a2c866482b9d4e934105f445a2', LayerKeys.Zip],
    ['b1d2b37add4d470ca32bfd9f40d91b9f', LayerKeys.Zip],
    ['3e2a4a9836864cfca10d87d0160d2697', LayerKeys.Zip],
    ['f0dd4c98bd3843c2b7ed16f04040ff13', LayerKeys.Zip],
    ['5432ed92099648b18e3b28d244492324', LayerKeys.Zip],
    ['ecde553e764e452c8dedda24236fa8d8', LayerKeys.Zip],
    ['f8e1b57f712d4144b8384e0399d038da', LayerKeys.ATZ],
    ['845911098c2d40828d9d356b4eff9d7a', LayerKeys.ATZ],
    ['9f56b26cf3ea4b93bc65cb90f831cf24', LayerKeys.ATZ],
    ['fedd50a5759c45ccb41edd96713628f9', LayerKeys.ATZ],
    ['5d2988905256472bb6a86af5141d1912', LayerKeys.ATZ],
    ['dac5cea6976a42ceb3f0498d2c901447', LayerKeys.ATZ],
    ['7bde296c08254ed78460accd00c8af49', LayerKeys.ATZ],
    ['5ba6eb49c71b475dbaa45783087a666b', LayerKeys.ATZ],
    ['a975f431a654437e891a2a534e805894', LayerKeys.ATZ],
    ['a0927bb2fb064544beb2813556f8619b', LayerKeys.DTZ],
    ['763c31ada0db4d09831edb2d19780c2d', LayerKeys.DTZ],
    ['9230ad1f421847f08d6bf0ae2f8ba00f', LayerKeys.DTZ],
    ['ae57986ce91144e98a65208ef8ae5a1d', LayerKeys.DTZ],
    ['c8840366618342d293723bc54ed2b0b5', LayerKeys.PCR],
    ['c55883ee9dca4bcfa9651c30d4945096', LayerKeys.PCR],
    ['2fe987a3c8b74c18a719433e69644bb0', LayerKeys.PCR],
    ['53b17d3b6de5403889dba73fa767f8ec', LayerKeys.PCR],
    ['8ac8074ac3c44d91bce4271928ac7e20', LayerKeys.PCR],
    ['60b63871c250465e9071dffa167ed3f3', LayerKeys.PCR],
    ['02029682807247bd956f3667d949ffa5', LayerKeys.Wrap],
    ['f187a7ead28d4bea8aea432d9211b06f', LayerKeys.Wrap],
    ['8dbaa84192c94b5eab3f4e685ba93af7', LayerKeys.Wrap],
    ['24c5bebecda14aed940504f8fda63e51', LayerKeys.Wrap],
  ]);

  public static serviceUrls = {
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`
  };
}
