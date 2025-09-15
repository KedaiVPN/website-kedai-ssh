import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, UserCircle } from 'lucide-react';
import { leaderboardService } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types/vpn';
import { toast } from 'sonner';

const LeaderboardTable: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await leaderboardService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: 'member' | 'reseller') => {
    const roleText = role.charAt(0).toUpperCase() + role.slice(1);
    const variant = role === 'reseller' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{roleText}</Badge>;
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };
  
  const getRankIndicator = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    }
    if (rank === 2) {
      return <Crown className="w-5 h-5 text-gray-400" />;
    }
    if (rank === 3) {
      return <Crown className="w-5 h-5 text-orange-400" />;
    }
    return <span className="font-bold text-muted-foreground">{rank}</span>;
  };

  const currentMonthYear = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <CardTitle className="text-xl">Monthly Leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Top 10 users for {currentMonthYear}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-2">
                <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-8 w-8"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Leaderboard is Empty</h3>
            <p className="text-muted-foreground">
              No transaction data to display yet.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Rank</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">
                        {getRankIndicator(index + 1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(user.total_transaksi)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardTable;
