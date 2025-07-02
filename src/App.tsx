import "./App.css";
import FileUpload from "./components/FileUploader/FileUploader";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import TransactionTable from "./components/TransactionsTable/TransactionsTable";

function App() {
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState("");

  const groupByOptions = ["None", "Date", "Type"];

  const handleDataParsed = (data: any[]) => {
    setRows(data);
    setHeaders(data.length ? Object.keys(data[0]) : []);
  };

  const clearData = () => {
    setRows([]);
    setHeaders([]);
  };

  function groupTransactions(rows: any[], key: string) {
    const trimmedKey = key.trim();
    return rows.reduce((acc, row) => {
      const groupValue = row[trimmedKey] || "Unknown";
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(row);
      return acc;
    }, {} as Record<string, any[]>);
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center">
        <Typography variant="h4" gutterBottom>
          Money Tracker
        </Typography>
        <Box marginLeft="auto" display="flex" alignItems={"center"}>
          {rows.length > 0 && (
            <FormControl sx={{ minWidth: 200, my: 2, color: "white" }}>
              <InputLabel sx={{ color: "white" }}>Group By</InputLabel>
              <Select
                value={groupBy}
                label="Group By"
                onChange={(e) => setGroupBy(e.target.value)}
                sx={{ color: "white" }}
              >
                {groupByOptions.map((header) => (
                  <MenuItem key={header} value={header} sx={{ color: "black" }}>
                    {header.trim()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {rows.length > 0 && (
            <Button
              sx={{
                bgcolor: "error.main",
                color: "text.primary",
                marginLeft: "1em",
              }}
              onClick={clearData}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>
      {!rows.length && (
        <FileUpload
          fileFormats=".csv, .xls, .xlsx"
          text="Upload your bank statements"
          onDataParsed={handleDataParsed}
        />
      )}
      {groupBy ? (
        Object.entries(groupTransactions(rows, groupBy)).map(
          ([group, groupedRows]: [string, any]) => (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {group === "Unknown" ? "" : group}
              </Typography>
              <TransactionTable headers={headers} rows={groupedRows} />
            </Box>
          )
        )
      ) : (
        <TransactionTable headers={headers} rows={rows} />
      )}
    </Container>
  );
}

export default App;
