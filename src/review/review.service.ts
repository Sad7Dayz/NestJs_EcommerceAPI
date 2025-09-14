import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../product/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './review.schema';

/**
 * UpdateReviewDto를 확장하여 user 필드를 추가한 인터페이스
 * TODO: 이 인터페이스의 실제 사용처 확인 및 필요성 검토
 * TODO: 네이밍을 더 명확하게 변경 (ExtendedUpdateReviewDto 등)
 */
interface newUpdateReviewDto extends UpdateReviewDto {
  user: string;
}

/**
 * 리뷰 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 주요 기능: 리뷰 생성, 조회, 수정, 삭제 및 상품 평점 관리
 * TODO: 전체적인 코드 리팩토링 및 성능 최적화 필요
 */
@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModule: Model<Review>,
    @InjectModel(Product.name) private readonly productModule: Model<Product>,
  ) {}
  /**
   * 새로운 리뷰를 생성하는 메서드
   * @param createReviewDto - 리뷰 생성에 필요한 데이터 (평점, 내용, 상품ID 등)
   * @param user_id - 리뷰 작성자의 사용자 ID
   *
   * 주요 동작 과정:
   * 1. 동일 사용자의 동일 상품에 대한 중복 리뷰 확인
   * 2. 리뷰 생성 및 관련 정보 populate
   * 3. 해당 상품의 전체 리뷰를 기반으로 평점 재계산
   * 4. 상품의 평균 평점 및 리뷰 개수 업데이트
   *
   * TODO: 매개변수명 일관성 유지 (camelCase vs snake_case)
   * TODO: 트랜잭션 처리 추가 (리뷰 생성 실패 시 롤백)
   */
  async create(createReviewDto: CreateReviewDto, user_id: string) {
    // 1단계: 중복 리뷰 검사
    // 동일한 사용자가 동일한 상품에 대해 이미 리뷰를 작성했는지 확인
    // 비즈니스 규칙: 한 사용자는 하나의 상품에 대해 하나의 리뷰만 작성 가능
    const review = await this.reviewModule.findOne({
      user: user_id, // 현재 사용자 ID
      product: createReviewDto.product, // 리뷰 대상 상품 ID
    });

    // 중복 리뷰가 존재하는 경우 에러 발생
    if (review) {
      // TODO: 에러 메시지 다국어 지원 추가
      // TODO: 에러 코드를 상수로 관리하여 일관성 확보
      throw new HttpException(
        'This User already Created Review On this Product',
        400,
      );
    }

    // 2단계: 새로운 리뷰 생성 및 관련 정보 조회
    // 리뷰 데이터를 데이터베이스에 저장하고 동시에 관련 정보를 populate
    // TODO: 중첩된 await 구조 개선 - 성능 최적화 필요
    // TODO: populate 필드를 상수로 관리하여 재사용성 향상
    const newReview = await (
      await this.reviewModule.create({
        ...createReviewDto, // DTO의 모든 속성을 전개 (rating, reviewText, product)
        user: user_id, // 작성자 ID 추가
      })
    ).populate('product user', 'name email title description imageCover');
    // populate 설명:
    // - 'product' 참조를 실제 상품 정보로 치환 (title, description, imageCover)
    // - 'user' 참조를 실제 사용자 정보로 치환 (name, email)

    // 3단계: 상품 평점 재계산을 위한 전체 리뷰 조회
    // 해당 상품에 대한 모든 리뷰의 평점을 조회하여 평균 계산 준비
    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: createReviewDto.product, // 특정 상품의 모든 리뷰 조회
      })
      .select('rating'); // 평점 필드만 선택하여 네트워크 트래픽 최소화

    const ratingsQuantity = reviewsOnSingleProduct.length; // 총 리뷰 개수

    // 4단계: 평균 평점 계산 및 상품 정보 업데이트
    if (ratingsQuantity > 0) {
      // 4-1단계: 모든 리뷰의 평점 합계 계산
      let totalRatings: number = 0;
      // TODO: for문을 reduce()로 변경하여 함수형 프로그래밍 패러다임 적용
      // TODO: 평점 계산 로직을 별도 메서드로 분리 (calculateAverageRating)
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }

      // 4-2단계: 평균 평점 계산
      const ratingsAverage = totalRatings / ratingsQuantity;
      // TODO: 소수점 처리 로직 추가 (Math.round를 사용하여 반올림)
      // TODO: 평점이 0점인 경우 처리 로직 추가

      // 4-3단계: 상품 문서에 계산된 평점 정보 업데이트
      await this.productModule.findByIdAndUpdate(createReviewDto.product, {
        ratingsAverage, // 평균 평점
        ratingsQuantity, // 총 리뷰 개수
      });
      // TODO: 업데이트 실패 시 에러 처리 추가
      // TODO: 상품이 존재하지 않는 경우 예외 처리
    }

    // 5단계: 성공 응답 반환
    // TODO: 응답 형식을 표준화된 DTO로 관리
    // TODO: HTTP 상태 코드를 응답 객체에서 제거 (컨트롤러에서 처리)
    return {
      status: 200,
      message: 'Review Created successfully', // TODO: 메시지 다국어 지원
      data: newReview,
    };
  }

  /**
   * 특정 상품에 대한 모든 리뷰를 조회하는 메서드
   * @param product_id - 조회할 상품의 ID
   *
   * 사용 목적: 상품 상세 페이지에서 해당 상품의 리뷰 목록 표시
   *
   * TODO: 페이징 처리 추가 (limit, skip 파라미터)
   * TODO: 정렬 옵션 추가 (최신순, 평점순, 도움순 등)
   * TODO: 필터링 옵션 추가 (평점별, 기간별 필터)
   */
  async findAll(product_id: string) {
    // 특정 상품에 대한 모든 리뷰 조회
    // populate을 통해 작성자 정보와 상품 정보를 함께 조회
    const review = await this.reviewModule
      .find({ product: product_id }) // 특정 상품의 모든 리뷰 검색
      .populate('user product', 'name email title') // 사용자명, 이메일, 상품명 조회
      .select('-__v'); // MongoDB의 버전 필드(__v) 제외
    // TODO: 민감한 정보 제외 (이메일 등을 클라이언트에 노출하지 않도록)
    // TODO: 리뷰 작성자의 다른 리뷰 개수, 평균 평점 등 추가 정보 포함

    return {
      status: 200,
      message: 'Reviews Found', // TODO: 메시지 개선 ('Reviews retrieved successfully')
      length: review.length, // 조회된 리뷰 개수
      data: review,
    };
  }

  /**
   * 특정 사용자가 작성한 모든 리뷰를 조회하는 메서드
   * @param user_id - 조회할 사용자의 ID
   *
   * 사용 목적:
   * - 사용자 마이페이지에서 본인이 작성한 리뷰 목록 확인
   * - 관리자 대시보드에서 특정 사용자의 리뷰 활동 모니터링
   *
   * TODO: 권한 검증 추가 (본인 리뷰만 조회 가능, 관리자 예외)
   * TODO: 페이징 및 정렬 기능 추가
   */
  async findOne(user_id: string) {
    // 특정 사용자가 작성한 모든 리뷰 조회
    // populate을 통해 사용자 정보와 리뷰 대상 상품 정보를 함께 조회
    const review = await this.reviewModule
      .find({ user: user_id }) // 특정 사용자의 모든 리뷰 검색
      .populate('user product', 'name role email title') // 사용자 정보 및 상품 정보 조회
      .select('-__v'); // MongoDB 버전 필드 제외
    // TODO: 보안상 민감한 정보 제거 (이메일, 역할 등)
    // TODO: 리뷰 작성 일시순으로 정렬 추가
    // TODO: 삭제된 상품에 대한 리뷰 처리 방안 검토

    return {
      status: 200,
      message: 'Reviews Found', // TODO: 더 구체적인 메시지로 변경
      length: review.length, // 사용자가 작성한 총 리뷰 개수
      data: review,
    };
  }

  /**
   * 기존 리뷰를 수정하는 메서드
   * @param id - 수정할 리뷰의 ID
   * @param updateReviewDto - 수정할 리뷰 데이터
   * @param user_id - 수정 요청자의 사용자 ID
   *
   * 주요 동작 과정:
   * 1. 리뷰 존재 여부 확인
   * 2. 수정 권한 검증 (작성자 본인만 수정 가능)
   * 3. 리뷰 정보 업데이트
   * 4. 상품 평점 재계산 및 업데이트
   *
   * TODO: 수정 가능한 필드 제한 (예: 상품 변경 불가)
   * TODO: 수정 이력 로깅 기능 추가
   */
  async update(id: string, updateReviewDto: UpdateReviewDto, user_id: string) {
    // 1단계: 수정 대상 리뷰 존재 여부 확인
    const findReview = await this.reviewModule.findById(id);

    // 리뷰가 존재하지 않는 경우 에러 발생
    if (!findReview) {
      // TODO: 에러 메시지 일관성 개선
      throw new NotFoundException('Not Found Review On this Id');
    }

    // 2단계: 수정 권한 검증
    // 리뷰 작성자와 수정 요청자가 동일한지 확인
    if (user_id.toString() !== findReview.user.toString()) {
      // ObjectId를 문자열로 변환하여 정확한 비교 수행
      // TODO: 관리자 권한 예외 처리 추가
      // TODO: 더 구체적인 에러 메시지 제공
      throw new UnauthorizedException();
    }

    // 3단계: 리뷰 정보 업데이트
    const updateReview = await this.reviewModule
      .findByIdAndUpdate(
        id,
        {
          ...updateReviewDto, // 업데이트할 모든 필드 전개
          user: user_id, // 사용자 ID 재설정 (보안상 이유)
          product: updateReviewDto.product, // 상품 ID (TODO: 상품 변경 방지 로직 필요)
        },
        { new: true }, // 업데이트된 문서를 반환하도록 설정
      )
      .select('-__v'); // 버전 필드 제외
    // TODO: 상품 변경을 허용하지 않도록 product 필드 제거
    // TODO: 업데이트 가능한 필드를 명시적으로 제한

    // 4단계: 상품 평점 재계산
    // Rating in product module - 주석 내용이 모호함
    // 리뷰가 수정되었으므로 해당 상품의 평점을 다시 계산해야 함

    // 4-1단계: 해당 상품의 모든 리뷰 조회
    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product, // 원본 리뷰의 상품 ID 사용
      })
      .select('rating'); // 평점만 조회

    const ratingsQuantity = reviewsOnSingleProduct.length;

    // 4-2단계: 평균 평점 재계산 및 상품 정보 업데이트
    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      // TODO: 중복 코드 제거 - 평점 계산 로직을 공통 메서드로 분리
      // TODO: for문을 reduce()로 변경하여 함수형 프로그래밍 적용
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;
      // TODO: 소수점 반올림 처리 추가

      // 상품의 평점 정보 업데이트
      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage,
        ratingsQuantity,
      });
      // TODO: 업데이트 실패 시 예외 처리
    }

    // 5단계: 성공 응답 반환
    return {
      status: 200,
      message: 'Review Updated successfully', // TODO: 메시지 다국어 지원
      data: updateReview,
    };
  }

  /**
   * 리뷰를 삭제하는 메서드
   * @param id - 삭제할 리뷰의 ID
   * @param user_id - 삭제 요청자의 사용자 ID
   *
   * 주요 동작 과정:
   * 1. 리뷰 존재 여부 확인
   * 2. 삭제 권한 검증 (작성자 본인만 삭제 가능)
   * 3. 리뷰 삭제 실행
   * 4. 상품 평점 재계산 및 업데이트
   *
   * TODO: 반환 타입을 명시적으로 정의
   * TODO: Soft Delete 방식 고려 (완전 삭제 대신 상태 변경)
   * TODO: 삭제 성공 응답 반환
   */
  async remove(id: string, user_id: string): Promise<void> {
    // 1단계: 삭제 대상 리뷰 존재 여부 확인
    const findReview = await this.reviewModule.findById(id);

    // 리뷰가 존재하지 않는 경우 에러 발생
    if (!findReview) {
      // TODO: 에러 메시지 일관성 개선
      throw new NotFoundException('Not Found Review On this Id');
    }

    // 2단계: 삭제 권한 검증
    // 리뷰 작성자와 삭제 요청자가 동일한지 확인
    if (user_id.toString() !== findReview.user.toString()) {
      // TODO: 관리자 권한으로 모든 리뷰 삭제 가능하도록 예외 처리 추가
      // TODO: 더 구체적인 에러 메시지 제공
      throw new UnauthorizedException();
    }

    // 3단계: 리뷰 삭제 실행
    await this.reviewModule.findByIdAndDelete(id);
    // TODO: 삭제 실패 시 예외 처리 추가
    // TODO: 관련 데이터 정리 (첨부파일, 좋아요 등)

    // 4단계: 리뷰 삭제 후 상품 평점 재계산
    // 리뷰가 삭제되었으므로 해당 상품의 평점 정보를 업데이트해야 함

    // 4-1단계: 남은 리뷰들 조회
    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product, // 삭제된 리뷰의 상품 ID로 나머지 리뷰 조회
      })
      .select('rating'); // 평점만 선택

    const ratingsQuantity = reviewsOnSingleProduct.length; // 남은 리뷰 개수

    // 4-2단계: 남은 리뷰가 있는 경우 평균 평점 재계산
    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      // TODO: 중복 코드 제거 - 평점 계산 로직 공통화 필요
      // TODO: 성능 최적화를 위한 aggregate 함수 사용 검토
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;

      // 상품의 평점 정보 업데이트
      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage, // 재계산된 평균 평점
        ratingsQuantity, // 남은 리뷰 개수
      });
    } else {
      // 4-3단계: 모든 리뷰가 삭제된 경우 평점 초기화
      // TODO: 리뷰가 없는 경우 평점을 0으로 초기화하거나 null로 처리할지 정책 결정 필요
      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage: 0,
        ratingsQuantity: 0,
      });
    }

    // TODO: 삭제 성공 응답 반환 (현재는 void 반환)
    // TODO: 삭제 완료 로깅 추가
  }

  /**
   * 상품의 평균 평점을 계산하고 업데이트하는 공통 메서드
   * @param productId - 평점을 계산할 상품의 ID (MongoDB ObjectId string)
   *
   * 목적:
   * - 코드 중복 제거: create, update, remove 메서드에서 반복되는 평점 계산 로직 통합
   * - 일관성 보장: 모든 평점 계산이 동일한 로직으로 처리
   * - 유지보수성 향상: 평점 계산 로직 변경 시 한 곳에서만 수정
   *
   * 주요 동작 과정:
   * 1. 특정 상품의 모든 리뷰 조회
   * 2. 리뷰 개수에 따른 분기 처리
   * 3. 평점이 있는 경우: 평균 계산 후 상품 업데이트
   * 4. 평점이 없는 경우: 평점 정보 초기화
   *
   * TODO: 이 메서드를 실제로 적용하여 중복 코드 제거
   * TODO: 에러 처리 및 로깅 추가
   * TODO: 성능 최적화를 위한 aggregate 사용 고려
   * TODO: 상품 존재 여부 사전 검증 추가
   */
  private async updateProductRatings(productId: string): Promise<void> {
    // 1단계: 특정 상품에 대한 모든 리뷰의 평점 데이터 조회
    // select('rating')을 사용하여 평점 필드만 조회하여 네트워크 부하 최소화
    const reviews = await this.reviewModule
      .find({ product: productId }) // 특정 상품 ID로 필터링
      .select('rating'); // 평점 필드만 선택하여 데이터 전송량 최적화
    // TODO: 인덱스 최적화를 위해 product 필드에 인덱스 설정 확인

    // 2단계: 조회된 리뷰 개수 확인
    const ratingsQuantity = reviews.length; // 해당 상품의 총 리뷰 개수
    // TODO: 대용량 데이터 처리를 위한 countDocuments() 사용 검토

    // 3단계: 리뷰 존재 여부에 따른 분기 처리
    if (ratingsQuantity > 0) {
      // 3-A 시나리오: 리뷰가 존재하는 경우 - 평점 계산 및 업데이트

      // 3-A-1단계: 모든 리뷰의 평점 합계 계산
      // reduce() 함수를 사용한 함수형 프로그래밍 접근 방식
      // 장점: 간결하고 가독성이 좋으며, 불변성을 유지
      const totalRatings = reviews.reduce(
        (sum, review) => sum + review.rating, // 누적값에 현재 리뷰의 평점을 더함
        0, // 초기값 0부터 시작
      );
      // 기존 for문 대신 reduce 사용으로 성능 및 가독성 향상
      // TODO: 평점 데이터 유효성 검증 (1-5 범위 체크 등)

      // 3-A-2단계: 평균 평점 계산 및 반올림 처리
      // 소수점 첫째 자리까지 표시하기 위한 반올림 로직
      const ratingsAverage =
        Math.round((totalRatings / ratingsQuantity) * 10) / 10;
      // 계산 과정:
      // 1. (총합 / 개수) = 평균값
      // 2. 평균값 * 10 = 소수점 이동
      // 3. Math.round() = 반올림
      // 4. / 10 = 소수점 복원
      // 예시: 4.67 → 46.7 → 47 → 4.7
      // TODO: 평점 표시 정책에 따라 소수점 자릿수 조정 가능하도록 상수화

      // 3-A-3단계: 계산된 평점 정보를 상품 문서에 업데이트
      await this.productModule.findByIdAndUpdate(productId, {
        ratingsAverage, // 계산된 평균 평점 (소수점 첫째 자리까지)
        ratingsQuantity, // 총 리뷰 개수
      });
      // TODO: 업데이트 결과 확인 및 실패 시 예외 처리
      // TODO: 상품이 존재하지 않는 경우 에러 처리
    } else {
      // 3-B 시나리오: 리뷰가 존재하지 않는 경우 - 평점 정보 초기화
      // 상황: 모든 리뷰가 삭제되었거나, 아직 리뷰가 작성되지 않은 경우

      // 3-B-1단계: 평점 정보를 기본값으로 초기화
      await this.productModule.findByIdAndUpdate(productId, {
        ratingsAverage: 0, // 평균 평점을 0으로 초기화
        ratingsQuantity: 0, // 리뷰 개수를 0으로 초기화
      });
      // 초기화 정책 고려사항:
      // - 0으로 설정: 명확하게 평점이 없음을 표시
      // - null로 설정: 평점이 평가되지 않음을 표시
      // - undefined: 필드를 제거하여 평점 정보 자체를 없앰
      // TODO: 비즈니스 요구사항에 따라 초기화 정책 결정
      // TODO: 프론트엔드에서 0점과 평점 없음을 구분하여 표시할 수 있도록 고려
    }

    // 4단계: 메서드 완료
    // 성공적으로 평점 업데이트가 완료된 경우 별도 반환값 없이 종료
    // Promise<void> 반환 타입에 맞게 암시적으로 undefined 반환

    // TODO: 성공/실패 로깅 추가
    // TODO: 업데이트 결과에 대한 검증 로직 추가
    // TODO: 에러 발생 시 적절한 예외 처리 및 복구 로직 구현
  }
}
