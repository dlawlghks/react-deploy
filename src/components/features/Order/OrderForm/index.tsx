import styled from '@emotion/styled';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Spacing } from '@/components/common/layouts/Spacing';
import { SplitLayout } from '@/components/common/layouts/SplitLayout';
import { useAuth } from '@/provider/Auth';
import { useBackend } from '@/provider/Auth/Backend';
import type { OrderFormData, OrderHistory } from '@/types';

import { HEADER_HEIGHT } from '../../Layout/Header';
import { GoodsInfo } from './GoodsInfo';
import { OrderFormMessageCard } from './MessageCard';
import { OrderFormOrderInfo } from './OrderInfo';

type Props = {
  orderHistory: OrderHistory;
};

export const OrderForm = ({ orderHistory }: Props) => {
  const { id, count } = orderHistory;
  const methods = useForm<OrderFormData>({
    defaultValues: {
      productId: id,
      productQuantity: count,
      senderId: 0,
      receiverId: 0,
      hasCashReceipt: false,
      usedPoints: 0, // 추가
    },
  });
  const { handleSubmit, setValue, watch } = methods;

  const { backendUrl } = useBackend();
  const authInfo = useAuth();
  const [remainingPoints, setRemainingPoints] = useState<number>(0);

  useEffect(() => {
    const fetchPoints = async () => {
      if (authInfo) {
        try {
          const response = await axios.get(`${backendUrl}/api/members/points`, {
            headers: {
              Authorization: `Bearer ${authInfo.token}`,
            },
          });
          setRemainingPoints(response.data.point);
        } catch (error) {
          console.error('Failed to fetch points:', error);
        }
      }
    };
    fetchPoints();
  }, [authInfo, backendUrl]);

  const handleForm = async (values: OrderFormData) => {
    const { errorMessage, isValid } = validateOrderForm(values);

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/orders`,
        {
          optionId: 1,
          quantity: values.productQuantity,
          message: values.messageCardTextMessage,
          point: values.usedPoints,
        },
        {
          headers: {
            Authorization: `Bearer ${authInfo?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        alert('주문이 완료되었습니다.');
      } else {
        alert('주문에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('주문에 실패했습니다.');
    }
  };

  // 포인트 사용 입력 핸들러
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), remainingPoints);
    setValue('usedPoints', value);
  };

  // Submit 버튼을 누르면 form이 제출되는 것을 방지하기 위한 함수
  const preventEnterKeySubmission = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLFormElement;
    if (e.key === 'Enter' && !['TEXTAREA'].includes(target.tagName)) {
      e.preventDefault();
    }
  };

  return (
    <FormProvider {...methods}>
      <form action="" onSubmit={handleSubmit(handleForm)} onKeyDown={preventEnterKeySubmission}>
        <SplitLayout
          sidebar={
            <OrderFormOrderInfo
              orderHistory={orderHistory}
              usedPoints={watch('usedPoints')}
              onPointsChange={handlePointsChange}
              remainingPoints={remainingPoints}
            />
          }
        >
          <Wrapper>
            <OrderFormMessageCard />
            <Spacing height={8} backgroundColor="#ededed" />
            <GoodsInfo orderHistory={orderHistory} />
          </Wrapper>
        </SplitLayout>
      </form>
    </FormProvider>
  );
};

const validateOrderForm = (values: OrderFormData): { errorMessage?: string; isValid: boolean } => {
  if (values.hasCashReceipt) {
    if (!values.cashReceiptNumber) {
      return {
        errorMessage: '현금영수증 번호를 입력해주세요.',
        isValid: false,
      };
    }

    if (!/^\d+$/.test(values.cashReceiptNumber)) {
      return {
        errorMessage: '현금영수증 번호는 숫자로만 입력해주세요.',
        isValid: false,
      };
    }
  }

  if (values.messageCardTextMessage.length < 1) {
    return {
      errorMessage: '메시지를 입력해주세요.',
      isValid: false,
    };
  }

  if (values.messageCardTextMessage.length > 100) {
    return {
      errorMessage: '메시지는 100자 이내로 입력해주세요.',
      isValid: false,
    };
  }

  return {
    isValid: true,
  };
};

const Wrapper = styled.div`
  border-left: 1px solid #e5e5e5;
  height: calc(100vh - ${HEADER_HEIGHT});
`;
