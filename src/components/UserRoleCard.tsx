
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, User } from 'lucide-react';

interface UserRoleCardProps {
  userRole: 'member' | 'reseller';
  onCreateAccount: () => void;
  onTopup: () => void;
}

const UserRoleCard: React.FC<UserRoleCardProps> = ({ 
  userRole, 
  onCreateAccount, 
  onTopup 
}) => {
  console.log('UserRoleCard: Received userRole:', userRole);
  
  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Role: {userRole === 'reseller' ? 'Reseller' : 'Member'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
          <Button onClick={onCreateAccount} size="lg" className="flex-1 sm:flex-none min-w-[200px]">
            <Plus className="w-5 h-5 mr-2" />
            Create Account
          </Button>
          <Button 
            onClick={onTopup} 
            size="lg" 
            className="flex-1 sm:flex-none min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Topup Saldo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleCard;
