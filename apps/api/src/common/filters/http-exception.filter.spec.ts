import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest
      .fn()
      .mockReturnValue({ method: 'GET', url: '/test' });

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException with object response (e.g. 400)', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid input',
        path: '/test',
      }),
    );
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Forbidden resource', 403);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden resource',
        path: '/test',
      }),
    );
  });

  it('should handle non-HttpException as 500 Internal Server Error', () => {
    const exception = new Error('something broke');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        path: '/test',
      }),
    );
  });

  it('should include correct timestamp and path', () => {
    const before = new Date().toISOString();
    const exception = new BadRequestException('bad');

    filter.catch(exception, mockHost);

    const body = mockJson.mock.calls[0][0];
    const after = new Date().toISOString();

    expect(body.path).toBe('/test');
    expect(body.timestamp).toBeDefined();
    expect(body.timestamp >= before).toBe(true);
    expect(body.timestamp <= after).toBe(true);
  });

  it('should log 5xx errors with stack trace', () => {
    const loggerSpy = jest
      .spyOn(filter['logger'], 'error')
      .mockImplementation();
    const exception = new InternalServerErrorException('server crash');

    filter.catch(exception, mockHost);

    expect(loggerSpy).toHaveBeenCalled();
    const logCall = loggerSpy.mock.calls[0];
    expect(logCall.join(' ')).toContain('server crash');
  });
});
