// Stub for html2canvas — jsPDF includes it as a dependency but we use native jsPDF commands instead.
// This empty module prevents html2canvas (202KB) from being bundled.
export default function html2canvas(): Promise<HTMLCanvasElement> {
  throw new Error('html2canvas is not available. Use native jsPDF methods instead.');
}
