import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from '../coupon/coupon.schema';
import { Product } from '../product/product.schema';
import { Cart } from './cart.schema';
import { UpdateCartItemsDto } from './dto/update-cart.dto';

/**
 * 장바구니 관련 비즈니스 로직을 처리하는 서비스
 * TODO: 전체적인 코드 리팩토링 필요
 */
@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModule: Model<Cart>,
    @InjectModel(Product.name) private readonly productModule: Model<Product>,
    @InjectModel(Coupon.name) private readonly couponModule: Model<Coupon>,
  ) {}
  /**
   * 장바구니에 상품을 추가하는 메서드
   * @param product_id - 추가할 상품 ID (MongoDB ObjectId string)
   * @param user_id - 사용자 ID (MongoDB ObjectId string)
   * @param isElse - 재귀 호출 시 사용하는 플래그 (내부 처리용)
   *
   * 동작 순서:
   * 1. 사용자의 기존 장바구니 조회 (상품 정보 포함)
   * 2. 추가하려는 상품의 존재 여부 및 재고 확인
   * 3. 기존 장바구니가 있으면 상품 추가/수량 증가 처리
   * 4. 기존 장바구니가 없으면 새 장바구니 생성 후 재귀 호출
   *
   * TODO: 매개변수명 일관성 유지 (camelCase 또는 snake_case)
   * TODO: isElse 매개변수 이름을 명확하게 변경 (isInternalCall 등)
   * TODO: 반환 타입을 명시적으로 정의하여 타입 안전성 향상
   */
  async create(product_id: string, user_id: string, isElse?: boolean) {
    // 1단계: 사용자의 기존 장바구니 조회 + 상품 정보 populate
    // findOne(): 조건에 맞는 첫 번째 문서를 반환, 없으면 null 반환
    // populate(): 참조된 ObjectId를 실제 문서 데이터로 치환 (SQL의 JOIN과 유사)
    // TODO: populate 필드를 상수로 관리하여 재사용성 향상
    const cart = await this.cartModule
      .findOne({ user: user_id }) // 특정 사용자의 장바구니 검색
      .populate('cartItems.productId', 'price priceAfterDiscount'); // 장바구니 내 상품들의 가격 정보만 조인

    // 2단계: 추가하려는 상품의 유효성 검증 프로세스
    const product = await this.productModule.findById(product_id); // MongoDB의 _id 필드로 상품 조회

    // 2-1단계: 상품 존재 여부 확인
    // not found this product
    if (!product) {
      // 상품이 데이터베이스에 존재하지 않는 경우 HTTP 404 에러 발생
      // TODO: 에러 메시지 다국어 지원 추가
      throw new NotFoundException('Not Found Product');
    }

    // 2-2단계: 상품 재고 확인
    // quantity=0
    if (product.quantity <= 0) {
      // 재고가 0 이하인 경우 품절 상태로 판단하여 에러 발생
      // TODO: 에러 메시지를 더 명확하게 개선 ('Product is out of stock')
      // TODO: 재고 부족 시 대기열 기능 추가 고려
      throw new NotFoundException('Not Found quantity on this product');
    }

    // 3단계: 기존 장바구니 존재 여부에 따른 분기 처리
    if (cart) {
      // 3-A 시나리오: 기존 장바구니가 존재하는 경우

      // 3-A-1단계: 동일 상품이 이미 장바구니에 있는지 검색
      // findIndex(): 조건을 만족하는 첫 번째 요소의 인덱스 반환, 없으면 -1 반환
      // TODO: 변수명을 더 명확하게 변경 (existingProductIndex, duplicateProductIndex 등)
      const indexIfProductAlridyInsert = cart.cartItems.findIndex(
        (item) => item.productId._id.toString() === product_id.toString(),
        // ObjectId 비교를 위해 문자열로 변환 필요 (MongoDB ObjectId는 객체 타입이므로)
        // toString() 메서드로 ObjectId를 문자열로 변환하여 정확한 비교 수행
      );

      // 3-A-2단계: 상품 추가 방식 결정 (기존 상품 vs 새 상품)
      if (indexIfProductAlridyInsert !== -1) {
        // 3-A-2-a: 이미 존재하는 상품인 경우 - 수량만 증가
        // 배열 인덱스를 사용하여 해당 상품의 수량을 1 증가
        cart.cartItems[indexIfProductAlridyInsert].quantity += 1;
        // TODO: 수량 증가 시 재고량 초과 방지 로직 추가
        // TODO: 최대 주문 가능 수량 제한 기능 추가
        // TODO: 수량 변경 로그 기록 기능 추가
      } else {
        // 3-A-2-b: 새로운 상품인 경우 - 장바구니에 새 항목 추가

        // TypeScript 타입 에러 해결을 위한 임시 조치
        // 현재 Cart 스키마의 TypeScript 타입과 실제 MongoDB 저장 구조가 불일치
        // TODO: @ts-ignore 제거하고 타입 안전성 확보 방안 수립
        // TODO: Cart 스키마의 TypeScript 타입 정의를 실제 저장/조회 상황에 맞게 개선

        // @ts-ignore
        cart.cartItems.push({ productId: product_id, color: '', quantity: 1 }); // 상품 ID (ObjectId 문자열 형태) 색상 (현재는 기본값으로 빈 문자열)// 초기 수량 1로 설정
      }

      // 3-A-3단계: 새로 추가된 상품의 가격 정보 획득을 위한 재조회
      // populate()를 다시 실행하는 이유: 새로 push된 상품은 ObjectId만 있고 실제 상품 정보가 없음
      // 가격 계산을 위해 모든 cartItems의 productId를 실제 상품 정보로 치환 필요
      // TODO: 성능 개선 - 전체 재조회 대신 새로 추가된 상품만 개별 populate
      // TODO: 이미 조회한 product 객체의 정보를 재활용하는 방안 검토
      await cart.populate('cartItems.productId', 'price priceAfterDiscount');

      // 3-A-4단계: 장바구니 총 가격 재계산 프로세스
      let totalPriceAfterInsert = 0; // 모든 상품의 정가 합계
      let totalDiscountPriceAfterInsert = 0; // 모든 상품의 할인 가격 합계

      // 장바구니 내 모든 상품에 대해 가격 계산 수행
      // TODO: map() 대신 reduce() 사용으로 함수형 프로그래밍 패러다임 적용
      // TODO: 가격 계산 로직을 별도 private 메서드로 분리 (calculateCartTotal 등)
      // TODO: 소수점 처리 및 반올림 로직 추가
      cart.cartItems.map((item) => {
        // 각 상품의 (수량 × 정가)를 총 정가에 누적
        totalPriceAfterInsert += item.quantity * item.productId.price;
        // 각 상품의 (수량 × 할인가)를 총 할인가에 누적
        totalDiscountPriceAfterInsert +=
          item.quantity * item.productId.priceAfterDiscount;
      });

      // 최종 결제 예정 금액 계산
      // 현재 로직: (정가 합계) - (할인가 합계) = 최종 가격
      // TODO: 할인 가격 계산 로직 재검토 및 개선 필요
      // 일반적인 전자상거래 로직: 할인가가 0이 아니면 할인가 사용, 0이면 정가 사용
      // TODO: 쿠폰 할인, 회원 등급 할인 등 추가 할인 정책 적용 고려
      cart.totalPrice = totalPriceAfterInsert - totalDiscountPriceAfterInsert;

      // 3-A-5단계: 변경된 장바구니 정보를 데이터베이스에 영구 저장
      await cart.save(); // MongoDB의 save() 메서드로 문서의 모든 변경사항을 DB에 반영
      // save() vs updateOne(): save()는 전체 문서를 저장, updateOne()은 특정 필드만 업데이트
      // TODO: 성능 최적화를 위해 변경된 필드만 업데이트하는 방식 검토

      // 3-A-6단계: 호출 방식에 따른 반환값 결정
      // isElse 플래그를 통해 반환 형태를 구분 (재귀 호출 vs 일반 호출)
      if (isElse) {
        // 재귀 호출인 경우: 순수 데이터만 반환 (새 장바구니 생성 후 호출되는 시나리오)
        // HTTP 응답 래퍼 없이 Cart 문서 객체 자체를 반환
        return cart;
      } else {
        // 일반 API 호출인 경우: HTTP 응답 형태로 구조화된 데이터 반환
        // 프론트엔드에서 사용하기 편한 표준 응답 형식
        // TODO: 응답 형식을 표준화된 DTO로 관리
        // TODO: 메시지를 다국어 지원 가능한 형태로 개선
        return {
          status: 200,
          message: 'Created Cart and Insert Product', // TODO: 'Product added to cart successfully'로 개선
          data: cart,
        };
      }
    } else {
      // 4단계: 3-B 시나리오 - 사용자의 장바구니가 존재하지 않는 경우 (첫 구매)

      // 4-1단계: 해당 사용자를 위한 새로운 빈 장바구니 문서 생성
      // 빈 장바구니를 먼저 생성하는 이유: 재귀 호출을 통한 상품 추가를 위함
      // TODO: 비효율적인 재귀 호출 구조 개선 - 빈 장바구니 생성과 동시에 상품 추가
      // TODO: 트랜잭션 처리 추가 (장바구니 생성 실패 시 롤백 필요)
      await this.cartModule.create({
        cartItems: [], // 초기 상품 배열은 비어있는 상태
        totalPrice: 0, // 초기 총 가격은 0으로 설정
        user: user_id, // 해당 사용자 ID와 연결
      });

      // 4-2단계: 재귀 호출을 통한 상품 추가 처리
      // 위에서 생성한 빈 장바구니에 상품을 추가하기 위해 동일 메서드를 재호출
      // isElse=true 설정으로 순수 데이터만 반환받도록 지정
      // TODO: 재귀 호출 구조를 제거하고 직접 상품 추가 로직 구현
      // TODO: Stack Overflow 방지를 위한 재귀 깊이 제한 추가
      const insertProduct = await this.create(
        product_id,
        user_id,
        (isElse = true), // TODO: 매개변수 전달 방식 개선 (할당 연산자 = 대신 콜론 : 사용)
      );

      // 4-3단계: 최종 응답 데이터 구성 및 반환
      // 새 장바구니 생성 + 상품 추가 완료 후 클라이언트에게 성공 응답 전송
      // TODO: 응답 메시지를 상황에 맞게 구체화 ('Cart created and product added successfully')
      return {
        status: 200,
        message: 'Created Cart and Insert Product',
        data: insertProduct, // 재귀 호출에서 받은 업데이트된 장바구니 데이터
      };
    }
  }

  async applyCoupon(user_id: string, couponName: string) {
    const cart = await this.cartModule.findOne({ user: user_id });
    const coupon = await this.couponModule.findOne({ name: couponName });

    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }
    if (!coupon) {
      throw new HttpException('Invalid coupon', 400);
    }
    const isExpired = new Date(coupon.expireDate) > new Date();
    if (!isExpired) {
      throw new HttpException('Invalid coupon', 400);
    }

    const ifCouponAlreadyUsed = cart.coupons.findIndex(
      (item) => item.name === couponName,
    );
    if (ifCouponAlreadyUsed !== -1) {
      throw new HttpException('Coupon already used', 400);
    }

    if (cart.totalPrice <= 0) {
      throw new HttpException('You have full discount', 400);
    }

    cart.coupons.push({ name: couponName, couponId: coupon._id.toString() });
    cart.totalPrice = cart.totalPrice - coupon.discount;
    await cart.save();

    return {
      status: 200,
      message: 'Coupon Applied',
      data: cart,
    };
  }

  async findOne(user_id: string) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price title description')
      .select('-__v');
    if (!cart) {
      throw new NotFoundException(
        `You don't have a cart please go to add product`,
      );
    }

    return {
      status: 200,
      message: 'Found cart',
      data: cart,
    };
  }

  async update(
    productId: string,
    user_id: string,
    updateCartItemsDto: UpdateCartItemsDto,
  ) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate(
        'cartItems.productId',
        'price title description priceAfterDiscount _id',
      );

    const product = await this.productModule.findById(productId);

    if (!cart) {
      const result = await this.create(productId, user_id);
      return result;
    }

    const indexProductUpdate = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (indexProductUpdate === -1) {
      throw new NotFoundException('Not Found Product in Cart');
    }

    if (updateCartItemsDto.color) {
      cart.cartItems[indexProductUpdate].color = updateCartItemsDto.color;
    }

    let totalPriceAfterUpdated = 0;
    let totalDiscountPriceAfterUpdate = 0;

    if (updateCartItemsDto.quantity) {
      cart.cartItems[indexProductUpdate].quantity = updateCartItemsDto.quantity;
      cart.cartItems.map((item) => {
        totalPriceAfterUpdated += item.quantity * item.productId.price;
        totalDiscountPriceAfterUpdate +=
          item.quantity * item.productId.priceAfterDiscount;
      });

      cart.totalPrice = totalPriceAfterUpdated - totalDiscountPriceAfterUpdate;
    }
    await cart.save();
    return {
      status: 200,
      menubar: 'Product Update',
      data: cart,
    };
  }

  async remove(productId: string, user_id: string) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate(
        'cartItems.productId',
        'price title description priceAfterDiscount _id',
      );
    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }
    const indexProductUpdate = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (indexProductUpdate === -1) {
      throw new NotFoundException('Not Found Product in Cart');
    }

    // @ts-ignore
    cart.cartItems = cart.cartItems.filter(
      (item, index) => index !== indexProductUpdate,
    );

    let totalPriceAfterInsert = 0;
    let totalDiscountPriceAfterInsert = 0;
    cart.cartItems.map((item) => {
      totalPriceAfterInsert += item.quantity * item.productId.price;
      totalDiscountPriceAfterInsert +=
        item.quantity * item.productId.priceAfterDiscount;
    });

    cart.totalPrice = totalPriceAfterInsert - totalDiscountPriceAfterInsert;
    await cart.save();

    return {
      status: 200,
      message: 'Deleted Product',
      data: cart,
    };
  }

  async findOneForAdmin(user_id: string) {
    const cart = await this.cartModule
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price title description');

    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }

    return {
      status: 200,
      message: 'Found cart',
      data: cart,
    };
  }
}
