import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// ★ここが必ず最初に実行されるようにする
Amplify.configure(outputs);

export {};
