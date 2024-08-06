import styled from '@emotion/styled';
import type { AxiosError } from 'axios';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  type ProductDetailRequestParams,
  useGetProductDetail,
} from '@/api/hooks/useGetProductDetail';
import { useGetProductOptions } from '@/api/hooks/useGetProductOptions';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/provider/Auth';
import { useBackend } from '@/provider/Auth/Backend';
import { getDynamicPath, RouterPath } from '@/routes/path';
import { authSessionStorage, orderHistorySessionStorage } from '@/utils/storage';

import { CountOptionItem } from './OptionItem/CountOptionItem';

type Props = ProductDetailRequestParams;

const getToken = () => {
  const token = authSessionStorage.get();
  console.log('Retrieved token:', token); // 토큰을 출력하여 확인
  return token;
};

export const OptionSection = ({ productId }: Props) => {
  const { data: detail } = useGetProductDetail({ productId });
  const { data: options } = useGetProductOptions({ productId });

  const [countAsString, setCountAsString] = useState('1');
  const totalPrice = useMemo(() => {
    return detail.price * Number(countAsString);
  }, [detail, countAsString]);

  const navigate = useNavigate();
  const authInfo = useAuth();
  const { backendUrl } = useBackend();

  const handleAddToWishList = async () => {
    const token = getToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!authInfo || !authInfo.token) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('Attempting to add to wishlist:', {
      productId: parseInt(productId),
      quantity: Number(countAsString),
      token,
    });

    try {
      const response = await axios.post(
        `${backendUrl}/api/wishes`,
        { productId: parseInt(productId), quantity: Number(countAsString) },
        {
          headers: {
            Authorization: `Bearer ${authInfo.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('API response:', response);

      if (response.status === 200) {
        alert('관심 등록 완료');
      } else {
        alert('관심 등록 실패');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('API error response:', axiosError.response);
        if (axiosError.response.status === 401) {
          alert('인증이 필요합니다.');
        } else if (axiosError.response.status === 400) {
          alert('잘못된 요청입니다.');
        } else if (axiosError.response.status === 404) {
          alert('상품을 찾을 수 없습니다.');
        } else {
          alert('관심 등록 실패');
        }
      } else {
        console.error('Failed to add to wishlist:', error);
        alert('관심 등록 실패');
      }
    }
  };

  const handleClick = () => {
    if (!authInfo) {
      const isConfirm = window.confirm(
        '로그인이 필요한 메뉴입니다.\n로그인 페이지로 이동하시겠습니까?',
      );

      if (!isConfirm) return;
      return navigate(getDynamicPath.login());
    }

    orderHistorySessionStorage.set({
      id: parseInt(productId),
      count: parseInt(countAsString),
    });

    navigate(RouterPath.order);
  };

  return (
    <Wrapper>
      <CountOptionItem name={options[0].name} value={countAsString} onChange={setCountAsString} />
      <BottomWrapper>
        <PricingWrapper>
          총 결제 금액 <span>{totalPrice}원</span>
        </PricingWrapper>
        <ButtonWrapper>
          <Button onClick={handleAddToWishList}>관심 등록</Button>
          <Button theme="black" size="large" onClick={handleClick}>
            나에게 선물하기
          </Button>
        </ButtonWrapper>
      </BottomWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  padding: 30px 12px 30px 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BottomWrapper = styled.div`
  padding: 12px 0 0;
`;

const PricingWrapper = styled.div`
  margin-bottom: 20px;
  padding: 18px 20px;
  border-radius: 4px;
  background-color: #f5f5f5;
  display: flex;
  justify-content: space-between;

  font-size: 14px;
  font-weight: 700;
  line-height: 14px;
  color: #111;

  & span {
    font-size: 20px;
    letter-spacing: -0.02em;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 8px;
`;