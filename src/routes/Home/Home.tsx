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
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import FileUpload from '../../components/FileUploader/FileUploader';
import TransactionTable from '../../components/TransactionsTable/TransactionsTable';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

const payeeGroups: Record<string, Record<string, string[]>> = {
  Essentials: {
    Groceries: [
      'PAK N SAVE WESTGATE',
      'WOOLWORTHS NZ/WESTGATE',
      'Pak N Save Lincoln Road',
      'WOOLWORTHS NZ/76 QUAY STR',
      'WOOLWORTHS',
    ],
    Fuel: ['PAK N SAVE FUEL WESTGATE'],
    'Car Insurance': ['AMI Insurance'],
  },
  Food: {
    Both: [
      'JEWEL OF INDIA',
      'ORDER MEAL',
      'SUBWAY WESTGATE',
      'Scarecrow',
      'THE TRUSTS ARENA',
      'BURGERFUEL WESTGATE',
      'BURGER KING',
      'TANK NWSC WESTGATE',
      'SHUBH RESTAURANT AND TAKE',
      'Duck Island Ice Crea',
    ],
    Raji: ['FISHER AND PAYKEL HEA', 'F P DANIELL CAFE', 'DD *DOORDASH NANDOS'],
    Rajesh: [
      'SUBWAY WILLIAM PICKERING',
      'Katsubi Rosedale',
      'MUFFIN BREAK NORTHWE',
      'KFC WEST CITY MALL - 624',
      'MCDONALDS WESTGATE',
    ],
  },
  Lifestyle: {
    Gym: ['DBS*Jetts Henderson'],
    Entertainment: ['EVENT CINEMAS WESTGATE', 'Chemist Warehouse'],
  },
  Misc: {
    'One off': [
      'FARMERS NORTH WEST',
      'HARVEY NORMAN WESTGATE',
      'GLASSONS - NORTHWEST',
      'WASH DEPOT HENDERSON',
      'THE WAREHOUSE 208 WESTGAT',
      'SMZ*Everlast Nails No61',
      'AUCKLANDTRANSPORTPARKING',
    ],
    Immigration: [
      'DEPT OF INTERNAL AFFAIRS',
      'MEG STAR',
      'WAREHOUSE STATIONERY WES',
    ],
    Dental: [
      'DR ANDY GRAYSON',
      'IAN CATHRO (ORAL SUR)',
      'ASCOT HOSPITAL PARKING',
    ],
  },

  'Incoming payments': {
    Paid: ['PAYMENT - THANK YOU'],
    Rewards: ['BNZ Cash Reward'],
  },
};

const Home = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const groupByOptions = ['None', 'Date', 'Type', 'Particulars', 'Payee'];
  const sortByOptions = ['None', ...headers];
  const amountHeader =
    headers.find((header) => header.trim().toLowerCase() === 'amount') ||
    headers.find((header) => header.trim().toLowerCase().includes('amount')) ||
    headers.find((header) => header.trim().toLowerCase() === 'debit') ||
    headers.find((header) => header.trim().toLowerCase() === 'credit');
  const displayHeaders = ['Date', 'Payee', amountHeader]
    .filter((header): header is string => Boolean(header))
    .map((header) => headers.find((item) => item === header) || header);

  const resolveHeaderKey = (key: string) =>
    headers.find(
      (header) => header.trim().toLowerCase() === key.trim().toLowerCase(),
    ) || key;

  const getRowValue = (row: any, key: string) => row[resolveHeaderKey(key)];

  const getGroupedPayee = (payee: unknown) => {
    if (typeof payee !== 'string') return payee || 'Unknown';

    const normalizePayee = (value: string) =>
      value.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedPayee = normalizePayee(payee);
    for (const [category, groups] of Object.entries(payeeGroups)) {
      for (const [group, payees] of Object.entries(groups)) {
        const matched = payees.some((groupedPayee) => {
          const normalizedGroupedPayee = normalizePayee(groupedPayee);

          return (
            normalizedPayee.includes(normalizedGroupedPayee) ||
            normalizedGroupedPayee.includes(normalizedPayee)
          );
        });

        if (matched) return `${category} / ${group}`;
      }
    }

    return `Uncategorised / ${payee || 'Unknown'}`;
  };

  const handleDataParsed = (data: any[]) => {
    setRows(data);
    setHeaders(data.length ? Object.keys(data[0]) : []);
  };

  const clearData = () => {
    setRows([]);
    setHeaders([]);
    setGroupBy('');
    setSortBy('');
    setExpandedGroups({});
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };

  const groupTransactions = (
    rows: any[],
    key: string,
  ): Record<string, any[]> => {
    return rows.reduce(
      (acc, row) => {
        const resolvedKey = resolveHeaderKey(key);
        const rowValue = getRowValue(row, resolvedKey);
        const groupValue =
          resolvedKey.trim().toLowerCase() === 'payee'
            ? getGroupedPayee(rowValue)
            : rowValue || 'Unknown';
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
  const isPayeeGrouping =
    groupBy && resolveHeaderKey(groupBy).trim().toLowerCase() === 'payee';

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
  const groupedPayeeCategories = isPayeeGrouping
    ? Object.entries(
        groupedTransactions.reduce(
          (acc, [group, groupedRows]) => {
            const [category, section] = group.includes(' / ')
              ? group.split(' / ', 2)
              : ['Other', group];

            if (!acc[category]) {
              acc[category] = {
                rows: [],
                sections: {},
              };
            }

            acc[category].rows.push(...groupedRows);
            acc[category].sections[section] = groupedRows;
            return acc;
          },
          {} as Record<
            string,
            {
              rows: any[];
              sections: Record<string, any[]>;
            }
          >,
        ),
      )
        .map(([category, categoryData]) => ({
          category,
          rows: categoryData.rows,
          sections: Object.entries(categoryData.sections).sort(
            ([sectionA, rowsA], [sectionB, rowsB]) => {
              if (isSortingByAmount) {
                return getSectionTotal(rowsA) - getSectionTotal(rowsB);
              }

              return sectionA.localeCompare(sectionB, undefined, {
                sensitivity: 'base',
              });
            },
          ),
        }))
        .sort((categoryA, categoryB) => {
          if (isSortingByAmount) {
            return (
              getSectionTotal(categoryA.rows) - getSectionTotal(categoryB.rows)
            );
          }

          return categoryA.category.localeCompare(
            categoryB.category,
            undefined,
            {
              sensitivity: 'base',
            },
          );
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
            {isPayeeGrouping ? (
              groupedPayeeCategories.map(({ category, rows, sections }) => {
                const categoryKey = `category:${category}`;
                const categoryExpanded = Boolean(expandedGroups[categoryKey]);

                return (
                  <Box
                    key={category}
                    sx={{
                      border: '1px solid rgba(255, 255, 255, 0.24)',
                      borderRadius: 1,
                      mb: 2,
                      p: 2,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={2}
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                          aria-label={
                            categoryExpanded
                              ? 'Collapse category'
                              : 'Expand category'
                          }
                          aria-expanded={categoryExpanded}
                          onClick={() => toggleGroup(categoryKey)}
                          sx={{
                            color: 'white',
                          }}
                          size="small"
                        >
                          {categoryExpanded ? (
                            <ExpandMoreIcon />
                          ) : (
                            <ChevronRightIcon />
                          )}
                        </IconButton>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {category}
                        </Typography>
                      </Box>
                      {amountHeader ? (
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                          Total: {getSectionTotal(rows).toFixed(2)}
                        </Typography>
                      ) : null}
                    </Box>
                    <Collapse
                      in={categoryExpanded}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ pl: 5 }}>
                        {sections.map(([section, sectionRows]) => {
                          const sectionKey = `section:${category}/${section}`;
                          const sectionExpanded = Boolean(
                            expandedGroups[sectionKey],
                          );

                          return (
                            <Box
                              key={sectionKey}
                              sx={{
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                borderRadius: 1,
                                mb: 2,
                                p: 2,
                              }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                gap={2}
                                mb={1}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <IconButton
                                    aria-label={
                                      sectionExpanded
                                        ? 'Collapse section'
                                        : 'Expand section'
                                    }
                                    aria-expanded={sectionExpanded}
                                    onClick={() => toggleGroup(sectionKey)}
                                    sx={{
                                      color: 'white',
                                    }}
                                    size="small"
                                  >
                                    {sectionExpanded ? (
                                      <ExpandMoreIcon />
                                    ) : (
                                      <ChevronRightIcon />
                                    )}
                                  </IconButton>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ color: 'white' }}
                                  >
                                    {section}
                                  </Typography>
                                </Box>
                                {amountHeader ? (
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ color: 'white' }}
                                  >
                                    Total:{' '}
                                    {getSectionTotal(sectionRows).toFixed(2)}
                                  </Typography>
                                ) : null}
                              </Box>
                              <Collapse
                                in={sectionExpanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <TransactionTable
                                  headers={displayHeaders}
                                  rows={sectionRows}
                                />
                              </Collapse>
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })
            ) : groupBy ? (
              groupedTransactions.map(([group, groupedRows]) => {
                const expanded = Boolean(expandedGroups[group]);

                return (
                  <Box
                    key={group}
                    sx={{
                      border: '1px solid rgba(255, 255, 255, 0.24)',
                      borderRadius: 1,
                      mb: 2,
                      p: 2,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={2}
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                          aria-label={
                            expanded ? 'Collapse group' : 'Expand group'
                          }
                          aria-expanded={expanded}
                          onClick={() => toggleGroup(group)}
                          sx={{
                            color: 'white',
                          }}
                          size="small"
                        >
                          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {group === 'Unknown' ? '' : group}
                        </Typography>
                      </Box>
                      {amountHeader ? (
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                          Total: {getSectionTotal(groupedRows).toFixed(2)}
                        </Typography>
                      ) : null}
                    </Box>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <TransactionTable
                        headers={displayHeaders}
                        rows={groupedRows}
                      />
                    </Collapse>
                  </Box>
                );
              })
            ) : (
              <TransactionTable headers={displayHeaders} rows={sortedRows} />
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
