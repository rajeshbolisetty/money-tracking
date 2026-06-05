import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FileUpload from '../../components/FileUploader/FileUploader';
import TransactionTable from '../../components/TransactionsTable/TransactionsTable';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');

  const groupByOptions = ['None', 'Date', 'Type', 'Particulars', 'Payee'];
  const sortByOptions = ['None', ...headers];
  const amountHeader =
    headers.find((header) => header.trim().toLowerCase() === 'amount') ||
    headers.find((header) => header.trim().toLowerCase().includes('amount')) ||
    headers.find((header) => header.trim().toLowerCase() === 'debit') ||
    headers.find((header) => header.trim().toLowerCase() === 'credit');

  const resolveHeaderKey = (key: string) =>
    headers.find(
      (header) => header.trim().toLowerCase() === key.trim().toLowerCase(),
    ) || key;

  const getRowValue = (row: any, key: string) => row[resolveHeaderKey(key)];

  const handleDataParsed = (data: any[]) => {
    setRows(data);
    setHeaders(data.length ? Object.keys(data[0]) : []);
  };

  const clearData = () => {
    setRows([]);
    setHeaders([]);
    setGroupBy('');
    setSortBy('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const groupTransactions = (
    rows: any[],
    key: string,
  ): Record<string, any[]> => {
    return rows.reduce(
      (acc, row) => {
        const groupValue = getRowValue(row, key) || 'Unknown';
        if (!acc[groupValue]) acc[groupValue] = [];
        acc[groupValue].push(row);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  };

  const parseAmount = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;

    const isNegative = value.includes('(') && value.includes(')');
    const amount = Number(value.replace(/[()$,\s]/g, ''));
    return Number.isFinite(amount) ? (isNegative ? -amount : amount) : 0;
  };

  const parseDate = (value: unknown) => {
    if (typeof value !== 'string') return Number.NaN;

    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : Number.NaN;
  };

  const getSectionTotal = (sectionRows: any[]) => {
    if (!amountHeader) return 0;

    return sectionRows.reduce(
      (total, row) => total + parseAmount(getRowValue(row, amountHeader)),
      0,
    );
  };

  const sortRows = (sectionRows: any[], key: string) => {
    if (!key) return sectionRows;

    return [...sectionRows].sort((a, b) => {
      const resolvedKey = resolveHeaderKey(key);
      const valueA = getRowValue(a, resolvedKey);
      const valueB = getRowValue(b, resolvedKey);
      const normalizedKey = resolvedKey.trim().toLowerCase();

      if (resolvedKey === amountHeader) {
        return parseAmount(valueA) - parseAmount(valueB);
      }

      if (normalizedKey.includes('date')) {
        const dateA = parseDate(valueA);
        const dateB = parseDate(valueB);

        if (Number.isFinite(dateA) && Number.isFinite(dateB)) {
          return dateA - dateB;
        }
      }

      return String(valueA || '').localeCompare(
        String(valueB || ''),
        undefined,
        {
          sensitivity: 'base',
        },
      );
    });
  };

  const activeSortBy = sortBy || (groupBy ? 'Payee' : '');
  const sortedRows = sortRows(rows, activeSortBy);
  const isSortingByAmount = Boolean(
    sortBy && amountHeader && resolveHeaderKey(sortBy) === amountHeader,
  );

  const groupedTransactions = groupBy
    ? Object.entries(groupTransactions(rows, groupBy))
        .map(
          ([group, groupedRows]) =>
            [group, sortRows(groupedRows, activeSortBy)] as const,
        )
        .sort(([groupA, rowsA], [groupB, rowsB]) => {
          if (isSortingByAmount) {
            return getSectionTotal(rowsA) - getSectionTotal(rowsB);
          }

          return groupA.localeCompare(groupB, undefined, {
            sensitivity: 'base',
          });
        })
    : [];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        py: 4,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={rows.length > 0 ? 4 : 2}
        >
          <Typography variant="h4" color="white">
            Money Tracker
          </Typography>

          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {!rows.length ? (
          <Card
            sx={{
              backgroundColor: '#1e1e1e',
              color: 'white',
              px: 4,
              py: 6,
              textAlign: 'center',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload your bank statements
              </Typography>
              <FileUpload
                fileFormats=".csv"
                text="Upload Now"
                onDataParsed={handleDataParsed}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              gap={2}
            >
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel sx={{ color: 'white' }}>Group By</InputLabel>
                  <Select
                    value={groupBy}
                    label="Group By"
                    onChange={(e) => setGroupBy(e.target.value)}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    {groupByOptions.map((header) => (
                      <MenuItem
                        key={header}
                        value={header === 'None' ? '' : header}
                        sx={{ color: 'black' }}
                      >
                        {header.trim()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel sx={{ color: 'white' }}>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    {sortByOptions.map((header) => (
                      <MenuItem
                        key={header}
                        value={header === 'None' ? '' : header}
                        sx={{ color: 'black' }}
                      >
                        {header.trim()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={clearData}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Clear All
              </Button>
            </Box>
            {groupBy ? (
              groupedTransactions.map(([group, groupedRows]) => (
                <Box key={group} sx={{ mb: 4 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={2}
                    mb={1}
                  >
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {group === 'Unknown' ? '' : group}
                    </Typography>
                    {amountHeader ? (
                      <Typography variant="subtitle1" sx={{ color: 'white' }}>
                        Total: {getSectionTotal(groupedRows).toFixed(2)}
                      </Typography>
                    ) : null}
                  </Box>
                  <TransactionTable headers={headers} rows={groupedRows} />
                </Box>
              ))
            ) : (
              <TransactionTable headers={headers} rows={sortedRows} />
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
