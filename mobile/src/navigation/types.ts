import { NavigatorScreenParams } from '@react-navigation/native';
import { ProductAnalysisOutput } from '../types';

export type BottomTabParamList = {
  Home: undefined;
  Scan: undefined;
  History: undefined;
  Guide: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList> | undefined;
  Result: {
    data: ProductAnalysisOutput;
    imageUri?: string | null;
  };
  Auth: {
    initialTab?: 'login' | 'signup';
  } | undefined;
};
